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
                convertEol: false, // Let the shell handle CRLF
                theme: {
                    background: "#1e1e1e",
                    foreground: "#cccccc",
                    cursor: "#ffffff",
                    selectionBackground: "#333333",
                    black: "#000000",
                    red: "#cd3131",
                    green: "#0dbc79",
                    yellow: "#e5e510",
                    blue: "#2472c8",
                    magenta: "#bc3fbc",
                    cyan: "#11a8cd",
                    white: "#e5e5e5",
                    brightBlack: "#666666",
                    brightRed: "#f14c4c",
                    brightGreen: "#23d18b",
                    brightYellow: "#f5f543",
                    brightBlue: "#3b8eea",
                    brightMagenta: "#d670d6",
                    brightCyan: "#29b8db",
                    brightWhite: "#e5e5e5"
                },
                rows: 30,
                scrollback: 5000,
            })

            fitAddon = new FitAddon()
            term.loadAddon(fitAddon)
            term.open(containerRef.current)

            // Fit adjustment before connecting
            try {
                fitAddon.fit()
            } catch (e) { console.warn("Initial fit failed", e) }

            const { cols: initialCols, rows: initialRows } = term
            const connectionUrl = `${socketUrl}?cols=${initialCols}&rows=${initialRows}`

            // Function to sync size to backend during session
            const syncSize = () => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    const { cols, rows } = term
                    socketRef.current.send(JSON.stringify({ type: 'resize', cols, rows }))
                }
            }

            // Connect to WebSocket with initial dimensions
            const ws = new WebSocket(connectionUrl)
            socketRef.current = ws

            ws.onopen = () => {
                term.writeln("\x1b[1;32m✓ Connected to Local Backend\x1b[0m")
                term.writeln("\x1b[90m> Spawning shell...\x1b[0m\r\n")
            }

            ws.onmessage = (event: any) => {
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

            // Handle terminal resizes from FitAddon
            term.onResize((size: { cols: number, rows: number }) => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }))
                }
            })
        }

        initTerminal()

        // Resize handler
        const handleResize = () => {
            if (fitAddon && term) {
                try {
                    fitAddon.fit()
                } catch (e) { }
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

    return (
        <div className="h-full w-full bg-[#1e1e1e] overflow-hidden p-2">
            <div ref={containerRef} className="h-full w-full" />
        </div>
    )
})
SocketTerminal.displayName = "SocketTerminal"
