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

// writeFileTool REMOVED - Agent now proposes patches instead of writing directly
/*
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
*/

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
    model: "gpt-5.1-codex-mini",
    instructions: `
You are Codex, an expert software engineer operating inside a real codebase.

CRITICAL RULES:
- You CANNOT write files directly
- You can ONLY read files and propose changes
- Output ONLY valid JSON - no markdown, no prose, no explanations
- All file modifications must be expressed as structured patches

Available Tools:
- read_file: Read file contents
- list_files: List all files in workspace

Output Format (REQUIRED):
{
  "changes": [
    {
      "path": "relative/path/to/file.py",
      "operation": "modify",
      "diff": "unified diff format here"
    }
  ]
}

Operations:
1. "modify" - Modify existing file
   - Requires: "diff" field with unified diff format
   - Example diff format:
     @@ -1,3 +1,4 @@
      from utils import greet
     -print(greet("World"))
     +try:
     +    print(greet("World"))
     +except Exception as e:
     +    print(f"Error: {e}")

2. "create" - Create new file
   - Requires: "content" field with full file contents

3. "delete" - Delete existing file
   - No additional fields required

Workflow:
1. Use list_files to discover structure
2. Use read_file to read files you need to modify
3. Output structured JSON with proposed changes
4. System will validate and apply changes safely

Example Response:
{
  "changes": [
    {
      "path": "main.py",
      "operation": "modify",
      "diff": "@@ -1,2 +1,5 @@\\n from utils import greet\\n-print(greet(\\"World\\"))\\n+try:\\n+    print(greet(\\"World\\"))\\n+except Exception as e:\\n+    print(f\\"Error: {e}\\")"
    }
  ]
}

REMEMBER: Output ONLY JSON. No explanations. No markdown blocks. Just pure JSON.
`,
    tools: [readFileTool, listFilesTool], // writeFileTool removed
});

/* ---------------- Planning Agent (GPT-5-mini) ---------------- */

const planningAgent = new Agent({
    name: "Planning Agent",
    model: "gpt-5-mini-2025-08-07",
    instructions: `
You are Codex Planning Mode. You create execution plans WITHOUT making code changes.

Your job: Analyze the request and output a JSON plan.

Output Format (REQUIRED):
{
  "files_to_modify": ["file1.py", "file2.py"],
  "rationale": "Brief explanation of approach and why these files",
  "estimated_changes": 2
}

Rules:
- Use list_files to discover structure
- Use read_file to understand code
- Output ONLY JSON - no prose, no markdown
- Be specific about which files need changes
- Explain the high-level approach

Example:
{
  "files_to_modify": ["main.py", "utils.py"],
  "rationale": "Add error handling to main.py and create helper function in utils.py for retry logic",
  "estimated_changes": 2
}
`,
    tools: [readFileTool, listFilesTool],
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

/* ---------------- Helper Functions ---------------- */

/**
 * Detect if request needs planning phase
 */
function detectComplexRequest(message) {
    const planKeywords = [
        'refactor',
        'restructure',
        'reorganize',
        'multiple files',
        'several files',
        'architecture',
        'design',
        'plan',
        'how should',
        'what approach'
    ];

    const lowerMessage = message.toLowerCase();
    return planKeywords.some(keyword => lowerMessage.includes(keyword));
}

/* ---------------- API: Chat ---------------- */

app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;
        console.log(`[DEBUG] Received ${messages?.length} messages`);

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Transfer-Encoding", "chunked");

        const userMessage = messages.map(m => m.content).join("\n");
        console.log(`[DEBUG] User message: ${userMessage}`);

        // Helper to emit events
        const emitEvent = (event) => {
            res.write(JSON.stringify(event) + "\n");
        };

        // Detect if this needs planning (complex request)
        const needsPlanning = detectComplexRequest(userMessage);
        let selectedAgent = ideAgent;
        let planContext = null;

        if (needsPlanning) {
            console.log(`[DEBUG] Complex request detected, using planning phase`);
            emitEvent({ type: "planning_started" });

            // Phase 1: Planning with GPT-4
            const planStream = await run(
                planningAgent,
                userMessage,
                { stream: true }
            );

            let planResponse = "";
            for await (const event of planStream) {
                let delta = null;
                if (event.type === "raw_model_stream_event" && event.data?.type === "output_text_delta") {
                    delta = event.data.delta;
                } else if (event.type === "output_text.delta" && event.delta) {
                    delta = event.delta;
                }
                if (delta) {
                    planResponse += delta;
                }
            }

            try {
                planContext = JSON.parse(planResponse);
                console.log(`[DEBUG] Plan created:`, planContext);
                emitEvent({
                    type: "plan_created",
                    plan: planContext
                });
            } catch (e) {
                console.error(`[ERROR] Failed to parse plan:`, e);
                emitEvent({
                    type: "error",
                    message: "Planning failed: " + planResponse.substring(0, 200)
                });
                res.end();
                return;
            }
        }

        // Get model response (should be JSON)
        const stream = await run(
            selectedAgent,
            planContext
                ? `Plan: ${JSON.stringify(planContext)}\n\nUser request: ${userMessage}\n\nImplement this plan with patches.`
                : userMessage,
            { stream: true }
        );

        console.log(`[DEBUG] Stream created, collecting response...`);
        let fullResponse = "";

        // Collect full response
        for await (const event of stream) {
            let delta = null;
            if (event.type === "raw_model_stream_event" && event.data?.type === "output_text_delta") {
                delta = event.data.delta;
            } else if (event.type === "output_text.delta" && event.delta) {
                delta = event.delta;
            }

            if (delta) {
                fullResponse += delta;
                // Stream the text for UX (user sees it being generated)
                emitEvent({ type: "model_output", delta });
            }
        }

        console.log(`[DEBUG] Full response collected:`, fullResponse);

        // Try to parse JSON response
        let patchProposal;
        try {
            patchProposal = JSON.parse(fullResponse);
        } catch (parseError) {
            console.error(`[ERROR] Failed to parse JSON:`, parseError);
            emitEvent({
                type: "error",
                message: "Model did not return valid JSON. Response: " + fullResponse.substring(0, 200)
            });
            res.end();
            return;
        }

        // Validate patch proposal structure
        if (!patchProposal.changes || !Array.isArray(patchProposal.changes)) {
            emitEvent({
                type: "error",
                message: "Invalid patch proposal: missing 'changes' array"
            });
            res.end();
            return;
        }

        console.log(`[DEBUG] Parsed ${patchProposal.changes.length} changes`);

        // Inline validator and applier (avoiding TS import issues)
        const crypto = require('crypto');

        // Simple validator
        const validateChange = async (change) => {
            const errors = [];
            const fullPath = path.join(WORKSPACE_DIR, change.path);

            // Check path safety
            const resolved = path.resolve(WORKSPACE_DIR, change.path);
            if (!resolved.startsWith(WORKSPACE_DIR)) {
                errors.push(`Unsafe path: ${change.path}`);
                return { valid: false, errors };
            }

            const fileExists = fs.existsSync(fullPath);

            switch (change.operation) {
                case 'modify':
                    if (!fileExists) errors.push(`Cannot modify non-existent file: ${change.path}`);
                    if (!change.diff) errors.push(`Modify requires diff: ${change.path}`);
                    break;
                case 'create':
                    if (fileExists) errors.push(`Cannot create existing file: ${change.path}`);
                    if (!change.content) errors.push(`Create requires content: ${change.path}`);
                    break;
                case 'delete':
                    if (!fileExists) errors.push(`Cannot delete non-existent file: ${change.path}`);
                    break;
                default:
                    errors.push(`Unknown operation: ${change.operation}`);
            }

            return { valid: errors.length === 0, errors };
        };

        // Simple applier
        const applyUnifiedDiff = (original, diff) => {
            const originalLines = original.split('\n');
            const result = [];
            const diffLines = diff.split('\n');
            let originalIndex = 0;

            for (const line of diffLines) {
                if (line.startsWith('@@')) continue;
                if (line.startsWith('+')) {
                    result.push(line.substring(1));
                } else if (line.startsWith('-')) {
                    originalIndex++;
                } else if (line.startsWith(' ')) {
                    if (originalIndex < originalLines.length) {
                        result.push(originalLines[originalIndex]);
                        originalIndex++;
                    }
                }
            }

            while (originalIndex < originalLines.length) {
                result.push(originalLines[originalIndex]);
                originalIndex++;
            }

            return result.join('\n');
        };

        const applyChange = async (change) => {
            const fullPath = path.join(WORKSPACE_DIR, change.path);

            try {
                switch (change.operation) {
                    case 'modify': {
                        const original = await fsp.readFile(fullPath, 'utf8');
                        const modified = applyUnifiedDiff(original, change.diff);
                        await fsp.writeFile(fullPath, modified, 'utf8');
                        break;
                    }
                    case 'create': {
                        await fsp.mkdir(path.dirname(fullPath), { recursive: true });
                        await fsp.writeFile(fullPath, change.content, 'utf8');
                        break;
                    }
                    case 'delete': {
                        await fsp.unlink(fullPath);
                        break;
                    }
                }
                return { success: true, path: change.path };
            } catch (error) {
                return { success: false, path: change.path, error: error.message };
            }
        };

        // Validate all changes
        emitEvent({ type: "validating_patches", count: patchProposal.changes.length });

        const allErrors = [];
        for (const change of patchProposal.changes) {
            const result = await validateChange(change);
            if (!result.valid) {
                allErrors.push(...result.errors);
            }
        }

        if (allErrors.length > 0) {
            console.error(`[ERROR] Validation failed:`, allErrors);
            emitEvent({
                type: "validation_failed",
                errors: allErrors
            });
            res.end();
            return;
        }

        // Apply changes atomically
        console.log(`[DEBUG] Applying ${patchProposal.changes.length} changes...`);

        const results = [];
        for (const change of patchProposal.changes) {
            emitEvent({
                type: "applying_patch",
                path: change.path,
                operation: change.operation
            });

            const result = await applyChange(change);
            results.push(result);

            // Stop on first failure
            if (!result.success) {
                console.error(`[ERROR] Patch failed for ${change.path}: ${result.error}`);
                break;
            }
        }

        // Check if all succeeded
        const allSucceeded = results.every(r => r.success);

        if (allSucceeded) {
            console.log(`[DEBUG] All patches applied successfully`);
            emitEvent({
                type: "done",
                summary: `Applied ${results.length} changes successfully`
            });
        } else {
            console.error(`[ERROR] Some patches failed`);
            const failedResults = results.filter(r => !r.success);
            emitEvent({
                type: "patch_failed",
                errors: failedResults.map(r => `${r.path}: ${r.error}`)
            });
        }

        res.end();
    } catch (err) {
        console.error("[ERROR] Agent error:", err);
        res.write(JSON.stringify({
            type: "error",
            message: err.message || "Unknown error"
        }) + "\n");
        res.end();
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
