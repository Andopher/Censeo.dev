import * as React from "react"
import { useEffect, useRef } from "react"
// Move imports inside useEffect to avoid SSR issues
import "xterm/css/xterm.css"

interface File {
    name: string
    content: string
}

interface TerminalProps {
    files: File[]
    onCommand?: (command: string) => void
}

// Expose a way to write to the terminal from the parent
export interface TerminalRef {
    write: (text: string) => void
    writeln: (text: string) => void
    clear: () => void
}

export const Terminal = React.forwardRef<TerminalRef, TerminalProps>(({ files, onCommand }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const terminalRef = useRef<any>(null) // Allow any because we import types dynamically or ignore them
    const commandRef = useRef("")

    // Expose methods to parent
    React.useImperativeHandle(ref, () => ({
        write: (text) => terminalRef.current?.write(text),
        writeln: (text) => terminalRef.current?.writeln(text),
        clear: () => terminalRef.current?.clear(),
    }))

    useEffect(() => {
        if (!containerRef.current) return

        let term: any = null
        let fitAddon: any = null

        const initTerminal = async () => {
            const { Terminal: XTerm } = await import("xterm")
            const { FitAddon } = await import("xterm-addon-fit")

            term = new XTerm({
                cursorBlink: true,
                fontSize: 14,
                fontFamily: "'Fira Code', monospace",
                theme: {
                    background: "#ffffff", // White background for light theme
                    foreground: "#0f172a", // Slate-900 text
                    cursor: "#0f172a",     // Dark cursor
                    selectionBackground: "#e2e8f0", // Slate-200 selection
                },
                rows: 20,
            })

            fitAddon = new FitAddon()
            term.loadAddon(fitAddon)

            term.open(containerRef.current)

            // Fix dimensions error: wait for render
            setTimeout(() => {
                try {
                    fitAddon.fit()
                } catch (e) {
                    console.warn("FitAddon error:", e)
                }
            }, 100)

            term.writeln("\x1b[1;34mWelcome to the Cloud IDE Terminal\x1b[0m")
            term.write("\x1b[1;32m➜\x1b[0m \x1b[1;34m/workspace\x1b[0m $ ")

            terminalRef.current = term

            // Handle Input
            term.onData((data: string) => {
                const code = data.charCodeAt(0)

                // Enter key
                if (code === 13) {
                    term.write("\r\n")
                    handleCommand(commandRef.current.trim(), term)
                    commandRef.current = ""
                    term.write("\x1b[1;32m➜\x1b[0m \x1b[1;34m/workspace\x1b[0m $ ")
                }
                // Backspace
                else if (code === 127) {
                    if (commandRef.current.length > 0) {
                        commandRef.current = commandRef.current.slice(0, -1)
                        term.write("\b \b")
                    }
                }
                // Printable characters
                else if (code >= 32) {
                    commandRef.current += data
                    term.write(data)
                }
            })
        }

        initTerminal()

        // Resize observer
        const resizeObserver = new ResizeObserver(() => {
            if (fitAddon) {
                try {
                    fitAddon.fit()
                } catch (e) { console.warn(e) }
            }
        })
        resizeObserver.observe(containerRef.current)

        return () => {
            resizeObserver.disconnect()
            if (term) term.dispose()
        }
    }, [])

    const handleCommand = (cmd: string, term: any) => {
        if (!cmd) return

        const parts = cmd.split(" ")
        const command = parts[0]
        const args = parts.slice(1)

        switch (command) {
            case "help":
                term.writeln("Available commands: ls, cat, clear, help, python")
                break
            case "clear":
                term.clear()
                break
            case "ls":
                files.forEach(f => term.writeln(f.name))
                break
            case "cat":
                if (args.length === 0) {
                    term.writeln("Usage: cat <filename>")
                } else {
                    const file = files.find(f => f.name === args[0])
                    if (file) {
                        // Split content by newlines to print correctly
                        file.content.split('\n').forEach(line => term.writeln(line))
                    } else {
                        term.writeln(`cat: ${args[0]}: No such file`)
                    }
                }
                break
            case "python":
                if (onCommand) onCommand(cmd)
                else term.writeln("Python runtime not connected.")
                break
            default:
                term.writeln(`command not found: ${command}`)
        }
    }

    return <div ref={containerRef} className="h-full w-full pl-2 pt-2" />
})
Terminal.displayName = "Terminal"
