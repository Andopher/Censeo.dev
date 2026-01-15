const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const os = require('os');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const WORKSPACE_DIR = path.join(__dirname, 'temp-workspace');
if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR);
}

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// --- OpenAI Setup ---
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Sync Files Endpoint
app.post('/api/save-files', (req, res) => {
    const { files } = req.body;

    if (files && Array.isArray(files)) {
        files.forEach(file => {
            const filePath = path.join(WORKSPACE_DIR, file.name);
            fs.writeFileSync(filePath, file.content);
        });
        console.log(`Synced ${files.length} files to workspace.`);
        res.status(200).send({ message: "Files synced" });
    } else {
        res.status(400).send({ error: "Invalid files format" });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, files } = req.body;

        // Construct System Prompt with File Context
        let systemPrompt = "You are an expert coding assistant embedded in a Cloud IDE.\n";
        systemPrompt += "You have access to the user's current codebase files below:\n\n";

        if (files && Array.isArray(files)) {
            files.forEach(file => {
                systemPrompt += `--- FILE: ${file.name} ---\n`;
                systemPrompt += `${file.content}\n\n`;
            });
        }

        systemPrompt += "Answer the user's questions based on this code. Be concise and technical.";

        const completion = await openai.chat.completions.create({
            model: "gpt-5.1-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            stream: true,
        });

        // Set headers for SSE (Server-Sent Events) or just raw stream
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                res.write(content);
            }
        }
        res.end();

    } catch (error) {
        console.error("OpenAI Error:", error);
        res.status(500).send("Error generating response");
    }
});

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

wss.on('connection', (ws) => {
    console.log("Client connected to terminal");

    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: WORKSPACE_DIR, // Spawn in the synced workspace
        env: process.env
    });

    // Send terminal output to websocket
    ptyProcess.on('data', (data) => {
        ws.send(data);
    });

    // Receive data from websocket and write to terminal
    ws.on('message', (message) => {
        ptyProcess.write(message);
    });

    ws.on('close', () => {
        console.log("Client disconnected");
        ptyProcess.kill();
    });
});

const PORT = 4000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend server functionality (Terminal + AI) running on http://localhost:${PORT}`);
});
