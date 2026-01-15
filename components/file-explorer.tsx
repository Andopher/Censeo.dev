"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileCode2, Plus, Trash2, FilePlus } from "lucide-react"

interface File {
    name: string
    content: string
}

interface FileExplorerProps {
    files: File[]
    activeFile: string
    onSelectFile: (name: string) => void
    onCreateFile: (name: string) => void
    onDeleteFile: (name: string) => void
}

export function FileExplorer({
    files,
    activeFile,
    onSelectFile,
    onCreateFile,
    onDeleteFile,
}: FileExplorerProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [newFileName, setNewFileName] = useState("")

    const handleCreate = () => {
        if (newFileName.trim()) {
            // Ensure .py extension if missing
            const name = newFileName.endsWith(".py") ? newFileName : `${newFileName}.py`
            onCreateFile(name)
            setNewFileName("")
            setIsCreating(false)
        }
    }

    return (
        <div className="flex flex-col h-full border-r border-border bg-[#1e1e1e]">
            <div className="flex items-center justify-between p-4 border-b border-border bg-[#252525] h-14">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Explorer</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10" onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-px p-1">
                    {files.map((file) => (
                        <div
                            key={file.name}
                            className={`group flex items-center justify-between rounded-none px-3 py-1.5 text-sm transition-colors cursor-pointer ${activeFile === file.name
                                ? "bg-[#2d2d2d] text-white font-medium shadow-sm"
                                : "text-gray-400 hover:bg-[#2d2d2d]/50 hover:text-gray-200"
                                }`}
                            onClick={() => onSelectFile(file.name)}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileCode2 className={`h-4 w-4 ${activeFile === file.name ? "text-blue-400" : "text-gray-500"
                                    }`} />
                                <span className="truncate">{file.name}</span>
                            </div>

                            {file.name !== "main.py" && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteFile(file.name)
                                    }}
                                >
                                    <Trash2 className="h-3 w-3 text-red-400 hover:text-red-500" />
                                </Button>
                            )}
                        </div>
                    ))}

                    {isCreating && (
                        <div className="flex items-center gap-2 px-2 py-1.5">
                            <FileCode2 className="h-4 w-4 text-gray-400" />
                            <Input
                                autoFocus
                                className="h-7 text-xs"
                                placeholder="filename.py"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreate()
                                    if (e.key === "Escape") setIsCreating(false)
                                }}
                                onBlur={() => setIsCreating(false)}
                            />
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
