"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import "xterm/css/xterm.css"

interface SocketTerminalProps {
    socketUrl?: string
}

export const SocketTerminal = React.forwardRef<any, SocketTerminalProps>(({ socketUrl = "ws://localhost:4000" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const socketRef = useRef<WebSocket | null>(null)
    const terminalRef = useRef<any>(null)

    useEffect(() => {
        if (!containerRef.current) return

        let term: any = null
        let fitAddon: any = null

        const initTerminal = async () => {
            const { Terminal } = await import("xterm")
            const { FitAddon } = await import("xterm-addon-fit")

            term = new Terminal({
                cursorBlink: true,
                fontSize: 14,
                fontFamily: "'Fira Code', monospace",
                theme: {
                    background: "#ffffff",
                    foreground: "#000000",
                    cursor: "#333333",
                    selectionBackground: "#e2e8f0",
                },
                rows: 20,
            })

            fitAddon = new FitAddon()
            term.loadAddon(fitAddon)
            term.open(containerRef.current)

            // Fit adjustment
            setTimeout(() => {
                try { fitAddon.fit() } catch (e) { console.warn(e) }
            }, 100)

            // Connect to WebSocket
            const ws = new WebSocket(socketUrl)
            socketRef.current = ws

            ws.onopen = () => {
                term.writeln("\x1b[1;32m✓ Connected to Local Backend\x1b[0m")
                term.writeln("\x1b[90m> Spawning shell...\x1b[0m\r\n")
            }

            ws.onmessage = (event) => {
                term.write(event.data)
            }

            ws.onerror = (err) => {
                term.writeln(`\r\n\x1b[31mConnection error. Is 'node server.js' running?\x1b[0m\r\n`)
            }

            ws.onclose = () => {
                term.writeln("\r\n\x1b[90m> Connection closed.\x1b[0m")
            }

            // Input handling
            term.onData((data: string) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(data)
                }
            })

            terminalRef.current = term
        }

        initTerminal()

        // Resize handler
        const handleResize = () => {
            if (fitAddon) {
                try { fitAddon.fit() } catch (e) { }
            }
        }
        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            if (socketRef.current) {
                socketRef.current.close()
            }
            if (term) term.dispose()
        }
    }, [socketUrl])

    return <div ref={containerRef} className="h-full w-full pl-2 pt-2 bg-white" />
})
SocketTerminal.displayName = "SocketTerminal"
