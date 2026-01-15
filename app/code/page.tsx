"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { CodeEditor } from "@/components/code-editor"
import type { TerminalRef } from "@/components/terminal"

const Terminal = dynamic(
    () => import("@/components/terminal").then((mod) => mod.Terminal),
    { ssr: false }
)
const SocketTerminal = dynamic(
    () => import("@/components/socket-terminal").then((mod) => mod.SocketTerminal),
    { ssr: false }
)
const AiChat = dynamic(
    () => import("@/components/ai-chat").then((mod) => mod.AiChat),
    { ssr: false }
)
import { FileExplorer } from "@/components/file-explorer"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Play, Save, Loader2, RefreshCw } from "lucide-react"

interface File {
    name: string
    content: string
}

const DEFAULT_FILES: File[] = [
    {
        name: "main.py",
        content: `from utils import greet, factorial

print(greet("World"))
print(f"5! = {factorial(5)}")
`
    },
    {
        name: "utils.py",
        content: `def greet(name):
    return f"Hello, {name}!"

def factorial(n):
    if n == 0 or n == 1:
        return 1
    return n * factorial(n-1)
`
    }
]

export default function CodePage() {
    const [files, setFiles] = useState<File[]>(DEFAULT_FILES)
    const [activeFile, setActiveFile] = useState("main.py")
    const [isRunning, setIsRunning] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Terminal state
    const terminalRef = useRef<TerminalRef>(null)

    // Worker state
    const workerRef = useRef<Worker | null>(null)
    const [isWorkerReady, setIsWorkerReady] = useState(false)
    const [workerError, setWorkerError] = useState<string | null>(null)

    // Load initial code
    useEffect(() => {
        const savedFiles = localStorage.getItem("code-files")
        if (savedFiles) {
            try {
                setFiles(JSON.parse(savedFiles))
            } catch (e) {
                console.error("Failed to parse saved files", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Autosave
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("code-files", JSON.stringify(files))
        }
    }, [files, isLoaded])

    // Initialize Worker
    useEffect(() => {
        if (!workerRef.current) {
            const worker = new Worker("/pyodide-worker.js");
            workerRef.current = worker;

            worker.onmessage = (event) => {
                const { type, content } = event.data;

                if (type === 'ready') {
                    setIsWorkerReady(true);
                    console.log("Pyodide worker execution environment ready");
                    terminalRef.current?.writeln("\x1b[1;32m✓ Python environment ready\x1b[0m");
                } else if (type === 'stdout') {
                    // Convert newlines for xterm
                    const formattedContent = content.replace(/\n/g, '\r\n')
                    terminalRef.current?.write(formattedContent);
                } else if (type === 'stderr') {
                    terminalRef.current?.writeln(`\x1b[31m${content}\x1b[0m`);
                } else if (type === 'done') {
                    terminalRef.current?.writeln("\r\n\x1b[90m> Program exited with code 0\x1b[0m\r\n");
                    terminalRef.current?.write("\x1b[1;32m➜\x1b[0m \x1b[1;34m/workspace\x1b[0m $ ");
                    setIsRunning(false);
                } else if (type === 'error') {
                    terminalRef.current?.writeln(`\r\n\x1b[31mTraceback (most recent call last):\r\n${content}\x1b[0m\r\n`);
                    terminalRef.current?.writeln("\x1b[90m> Program exited with error\x1b[0m\r\n");
                    terminalRef.current?.write("\x1b[1;32m➜\x1b[0m \x1b[1;34m/workspace\x1b[0m $ ");
                    setIsRunning(false);
                }
            };

            worker.onerror = (err) => {
                console.error("Worker error:", err);
                setWorkerError("Failed to initialize Python worker");
                setIsRunning(false);
            };
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        }
    }, [])

    // Sync initial files to backend
    useEffect(() => {
        if (files.length > 0) {
            fetch("http://localhost:4000/api/save-files", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files })
            }).catch(e => console.error("Failed to sync files on load", e));
        }
    }, [isLoaded]); // Sync after LocalStorage load

    const handleRun = () => {
        // Also save to backend before running
        fetch("http://localhost:4000/api/save-files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ files })
        }).catch(e => console.error("Failed to sync files on run", e));

        if (!workerRef.current || !isWorkerReady) {
            terminalRef.current?.writeln("Python environment is still loading...");
            return;
        }

        setIsRunning(true)
        terminalRef.current?.writeln("\x1b[90mRunning...\x1b[0m");

        // Send all files to the worker to be mounted
        workerRef.current.postMessage({
            type: 'run',
            code: files.find(f => f.name === activeFile)?.content || "",
            files: files
        });
    }

    const handleReset = () => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsWorkerReady(false);
            window.location.reload();
        }
    }

    const reloadFilesFromWorkspace = async () => {
        try {
            const response = await fetch("http://localhost:4000/api/list-workspace-files");
            if (!response.ok) return;

            const { files: workspaceFiles } = await response.json();

            // Update files with content from workspace
            setFiles(prev => prev.map(f => {
                const wsFile = workspaceFiles.find((wf: any) => wf.name === f.name);
                return wsFile ? { ...f, content: wsFile.content } : f;
            }));
        } catch (error) {
            console.error("Failed to reload files from workspace:", error);
        }
    }

    // File Management
    const getActiveContent = () => files.find(f => f.name === activeFile)?.content || ""

    const updateActiveContent = (newContent: string) => {
        setFiles(prev => prev.map(f => f.name === activeFile ? { ...f, content: newContent } : f))
    }

    const handleCreateFile = (name: string) => {
        if (files.some(f => f.name === name)) return // Prevent duplicates
        setFiles(prev => [...prev, { name, content: "" }])
        setActiveFile(name)
    }

    const handleDeleteFile = (name: string) => {
        setFiles(prev => prev.filter(f => f.name !== name))
        if (activeFile === name) {
            setActiveFile("main.py") // Default fallback
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#F9F9F6]">
            {/* Site Header / Logo */}
            <nav className="p-4 flex justify-between items-center max-w-[1600px] w-full mx-auto">
                <Link href="/" className="text-xl font-bold tracking-tight text-foreground">Censeo</Link>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <h1 className="text-sm font-bold tracking-tight text-foreground">Technical Assessment</h1>
                        <p className="text-[10px] text-secondary uppercase tracking-wider font-medium">
                            Python Engineering Judgment
                        </p>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex flex-col p-4 pt-0 max-w-[1600px] w-full mx-auto">
                {/* Unified IDE Container */}
                <div className="flex flex-col rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/5 bg-[#1e1e1e]">
                    {/* Top Row: Editor + AI Chat */}
                    <div className="grid lg:grid-cols-[1fr_400px]">
                        {/* Main Content Area: Editor + Explorer */}
                        <div className="flex flex-col">
                            <Card className="flex flex-1 flex-col overflow-hidden border-none rounded-none bg-[#1e1e1e] h-[500px] shadow-none">
                                <div className="flex h-full">
                                    {/* File Explorer Sidebar */}
                                    <div className="w-56 h-full border-r border-border">
                                        <FileExplorer
                                            files={files}
                                            activeFile={activeFile}
                                            onSelectFile={setActiveFile}
                                            onCreateFile={handleCreateFile}
                                            onDeleteFile={handleDeleteFile}
                                        />
                                    </div>

                                    {/* Editor Area */}
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="flex items-center justify-between border-b border-border bg-[#252525] p-4 h-14">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{activeFile}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 relative">
                                            <CodeEditor
                                                className="absolute inset-0 border-none rounded-none"
                                                value={getActiveContent()}
                                                onChange={(value) => updateActiveContent(value || "")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Right Sidebar: AI Chat */}
                        <div className="flex flex-col h-[500px]">
                            <AiChat files={files} className="h-full shadow-sm border border-border" onFilesChanged={reloadFilesFromWorkspace} />
                        </div>
                    </div>

                    {/* Bottom Row: Terminal */}
                    <Card className="overflow-hidden flex flex-col h-[350px] border-t border-border border-b-0 border-x-0 rounded-none bg-[#1e1e1e] shadow-none">
                        <CardHeader className="py-2 px-4 border-b border-border bg-[#252525] min-h-[40px] flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Local Terminal (WS)</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={handleRun} disabled={isRunning} className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/10">
                                    {isRunning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                                    Run
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/10">
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Reset
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 bg-[#1e1e1e] border-none relative">
                            <div className="absolute inset-0">
                                <SocketTerminal />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
