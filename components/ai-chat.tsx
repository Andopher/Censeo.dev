"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
    role: "user" | "assistant"
    content: string
}

interface AiChatProps {
    files: { name: string; content: string }[]
    className?: string
    onFilesChanged?: () => void
}

export function AiChat({ files, className, onFilesChanged }: AiChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm Codex, your AI coding assistant. I can see your files. How can I help you?" }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: "user", content: input }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        try {
            const response = await fetch("http://localhost:4000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
                    files: files // Send current file context
                })
            })

            if (!response.ok) throw new Error("Failed to fetch response")
            if (!response.body) throw new Error("No response body")

            // Stream handling
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let assistantMessage: Message = { role: "assistant", content: "" }

            setMessages(prev => [...prev, assistantMessage])

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                assistantMessage = { ...assistantMessage, content: assistantMessage.content + chunk }

                setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = assistantMessage
                    return newMessages
                })
            }

            // Reload files after AI response completes
            if (onFilesChanged) {
                onFilesChanged()
            }

        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error connecting to the AI backend." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className={cn("flex flex-col h-full border-l border-border rounded-none bg-[#1e1e1e] shadow-none", className)}>
            <CardHeader className="p-4 border-b border-border bg-[#252525] h-14">
                <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    Codex
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full px-4 py-4">
                    <div className="flex flex-col gap-4">
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex gap-3", m.role === "assistant" ? "" : "flex-row-reverse")}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    m.role === "assistant" ? "bg-blue-500/10 text-blue-400" : "bg-[#333333] text-gray-400"
                                )}>
                                    {m.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                </div>
                                <div className={cn(
                                    "rounded-lg p-3 text-sm max-w-[85%]",
                                    m.role === "assistant" ? "bg-[#252525] text-gray-200 prose prose-invert prose-sm max-w-none" : "bg-blue-600 text-white"
                                )}>
                                    {m.role === "assistant" ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {m.content}
                                        </ReactMarkdown>
                                    ) : (
                                        m.content
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="bg-muted/30 rounded-lg p-3">
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t border-border bg-[#1e1e1e]">
                <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask about your code..."
                        className="flex-1 bg-[#2d2d2d] border-border text-gray-200 placeholder:text-gray-500"
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700">
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    )
}
