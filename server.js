const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const pty = require("node-pty");
const os = require("os");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
require("dotenv").config();

const OpenAI = require("openai").default;
const { Agent, run, tool } = require("@openai/agents");
const { z } = require("zod");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const WORKSPACE_DIR = path.join(__dirname, "temp-workspace");
if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

/* ---------------- OpenAI Client ---------------- */

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/* ---------------- Agent Tools ---------------- */

const readFileTool = tool({
    name: "read_file",
    description: "Read a file from the workspace",
    parameters: z.object({
        path: z.string(),
    }),
    async execute({ path: filePath }) {
        const fullPath = filePath.startsWith("/")
            ? filePath
            : path.join(WORKSPACE_DIR, filePath);

        return await fsp.readFile(fullPath, "utf8");
    },
});

const writeFileTool = tool({
    name: "write_file",
    description: "Write or overwrite a file in the workspace",
    parameters: z.object({
        path: z.string(),
        contents: z.string(),
    }),
    async execute({ path: filePath, contents }) {
        const fullPath = filePath.startsWith("/")
            ? filePath
            : path.join(WORKSPACE_DIR, filePath);

        await fsp.mkdir(path.dirname(fullPath), { recursive: true });
        await fsp.writeFile(fullPath, contents, "utf8");

        return "ok";
    },
});

const listFilesTool = tool({
    name: "list_files",
    description: "List all files in the workspace",
    parameters: z.object({}),
    async execute() {
        const walk = async (dir, base = "") => {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            let files = [];
            for (const e of entries) {
                const rel = path.join(base, e.name);
                const abs = path.join(dir, e.name);
                if (e.isDirectory()) {
                    files = files.concat(await walk(abs, rel));
                } else {
                    files.push(rel);
                }
            }
            return files;
        };
        return await walk(WORKSPACE_DIR);
    },
});

/* ---------------- Agent ---------------- */

const ideAgent = new Agent({
    name: "IDE Agent",
    model: "gpt-5.2",
    instructions: `
You are an expert software engineer operating inside a real codebase.

Rules:
- Never assume file contents.
- Always read files before modifying them.
- Use list_files to discover structure.
- Make minimal, correct changes.
- Explain changes briefly at the end.
`,
    tools: [readFileTool, writeFileTool, listFilesTool],
});

/* ---------------- API: Save Files ---------------- */

app.post("/api/save-files", async (req, res) => {
    const { files } = req.body;

    if (!Array.isArray(files)) {
        return res.status(400).json({ error: "Invalid files format" });
    }

    for (const file of files) {
        const filePath = path.join(WORKSPACE_DIR, file.name);
        await fsp.mkdir(path.dirname(filePath), { recursive: true });
        await fsp.writeFile(filePath, file.content, "utf8");
    }

    res.json({ message: `Synced ${files.length} files` });
});

/* ---------------- API: List Workspace Files ---------------- */

app.get("/api/list-workspace-files", async (req, res) => {
    try {
        const walk = async (dir, base = "") => {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            let files = [];
            for (const e of entries) {
                const rel = path.join(base, e.name);
                const abs = path.join(dir, e.name);
                if (e.isDirectory()) {
                    files = files.concat(await walk(abs, rel));
                } else {
                    const content = await fsp.readFile(abs, "utf8");
                    files.push({ name: rel, content });
                }
            }
            return files;
        };
        const files = await walk(WORKSPACE_DIR);
        res.json({ files });
    } catch (error) {
        console.error("Error listing workspace files:", error);
        res.status(500).json({ error: "Failed to list files" });
    }
});

/* ---------------- API: Chat ---------------- */

app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;
        console.log(`[DEBUG] Received ${messages?.length} messages`);
        console.log(`[DEBUG] Messages:`, JSON.stringify(messages, null, 2));

        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Transfer-Encoding", "chunked");

        const userMessage = messages.map(m => m.content).join("\n");
        console.log(`[DEBUG] User message: ${userMessage}`);

        const stream = await run(
            ideAgent,
            userMessage,
            { stream: true }
        );

        console.log(`[DEBUG] Stream created, iterating...`);
        let eventCount = 0;

        for await (const event of stream) {
            eventCount++;

            // Extract delta from nested structure
            let delta = null;
            if (event.type === "raw_model_stream_event" && event.data?.type === "output_text_delta") {
                delta = event.data.delta;
            } else if (event.type === "output_text.delta" && event.delta) {
                delta = event.delta;
            }

            if (delta) {
                res.write(delta);
            }
        }

        console.log(`[DEBUG] Stream finished. Total events: ${eventCount}`);
        res.end();
    } catch (err) {
        console.error("[ERROR] Agent error:", err);
        res.status(500).send("Agent error");
    }
});

/* ---------------- Terminal ---------------- */

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const cols = parseInt(url.searchParams.get("cols")) || 80;
    const rows = parseInt(url.searchParams.get("rows")) || 30;

    const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-256color",
        cols,
        rows,
        cwd: WORKSPACE_DIR,
        env: {
            ...process.env,
            TERM: "xterm-256color",
            COLORTERM: "truecolor",
        },
    });

    ptyProcess.on("data", data => ws.send(data));

    ws.on("message", msg => {
        try {
            const parsed = JSON.parse(msg.toString());
            if (parsed.type === "resize") {
                ptyProcess.resize(parsed.cols, parsed.rows);
                return;
            }
        } catch { }
        ptyProcess.write(msg);
    });

    ws.on("close", () => ptyProcess.kill());
});

/* ---------------- Server ---------------- */

const PORT = 4000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`IDE backend running on http://localhost:${PORT}`);
});
