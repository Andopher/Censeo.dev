"use client"

import { useState } from "react"
import { Check, X, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FileDiff, DiffLine } from "@/lib/diff-parser"

interface DiffReviewPanelProps {
    diffs: FileDiff[]
    onApply: (filename: string, acceptedChanges: DiffLine[]) => void
    onDismiss: () => void
}

export function DiffReviewPanel({ diffs, onApply, onDismiss }: DiffReviewPanelProps) {
    const [lineStates, setLineStates] = useState<Record<string, 'accepted' | 'declined' | 'pending'>>({})

    const handleLineAction = (diffIndex: number, lineIndex: number, action: 'accept' | 'decline') => {
        const key = `${diffIndex}-${lineIndex}`
        setLineStates(prev => ({ ...prev, [key]: action === 'accept' ? 'accepted' : 'declined' }))
    }

    const handleApplyFile = (diffIndex: number) => {
        const diff = diffs[diffIndex]
        const acceptedChanges = diff.changes.filter((change, idx) => {
            const key = `${diffIndex}-${idx}`
            // Include context lines and non-declined changes
            return change.type === 'context' || lineStates[key] !== 'declined'
        })
        onApply(diff.filename, acceptedChanges)
    }

    const handleAcceptAll = (diffIndex: number) => {
        const diff = diffs[diffIndex]
        const newStates: Record<string, 'accepted' | 'declined' | 'pending'> = {}
        diff.changes.forEach((change, idx) => {
            if (change.type !== 'context') {
                newStates[`${diffIndex}-${idx}`] = 'accepted'
            }
        })
        setLineStates(prev => ({ ...prev, ...newStates }))
    }

    const handleDeclineAll = (diffIndex: number) => {
        const diff = diffs[diffIndex]
        const newStates: Record<string, 'accepted' | 'declined' | 'pending'> = {}
        diff.changes.forEach((change, idx) => {
            if (change.type !== 'context') {
                newStates[`${diffIndex}-${idx}`] = 'declined'
            }
        })
        setLineStates(prev => ({ ...prev, ...newStates }))
    }

    return (
        <Card className="absolute top-0 right-0 w-[450px] h-full bg-[#1e1e1e] border-l border-border z-10 rounded-none shadow-none">
            <div className="flex items-center justify-between p-4 border-b border-border bg-[#252525] h-14">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Review Changes
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10" onClick={onDismiss}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <ScrollArea className="h-[calc(100%-56px)]">
                {diffs.map((diff, diffIdx) => (
                    <div key={diffIdx} className="border-b border-border">
                        <div className="sticky top-0 bg-[#252525] p-3 border-b border-border z-10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-mono text-gray-300">{diff.filename}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                    onClick={() => handleAcceptAll(diffIdx)}
                                >
                                    <Check className="w-3 h-3 mr-1" />
                                    Accept All
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-red-500/50 text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleDeclineAll(diffIdx)}
                                >
                                    <X className="w-3 h-3 mr-1" />
                                    Decline All
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 ml-auto"
                                    onClick={() => handleApplyFile(diffIdx)}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>

                        <div className="p-3 space-y-1">
                            {diff.changes.map((change, lineIdx) => {
                                const key = `${diffIdx}-${lineIdx}`
                                const state = lineStates[key] || 'pending'

                                if (change.type === 'context') {
                                    return (
                                        <div key={lineIdx} className="flex items-start gap-2 p-2 font-mono text-xs text-gray-500">
                                            <span className="text-gray-600 select-none w-4 text-center"> </span>
                                            <code className="flex-1">{change.content}</code>
                                        </div>
                                    )
                                }

                                const isAdd = change.type === 'add'
                                const bgColor = state === 'accepted'
                                    ? (isAdd ? 'bg-green-500/30 border-green-500' : 'bg-red-500/30 border-red-500')
                                    : state === 'declined'
                                        ? 'bg-gray-500/10 border-gray-500/30'
                                        : (isAdd ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50')

                                return (
                                    <div
                                        key={lineIdx}
                                        className={`flex items-start gap-2 p-2 rounded border-l-2 ${bgColor} transition-colors`}
                                    >
                                        <span className={`select-none w-4 text-center font-bold ${isAdd ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {isAdd ? '+' : '-'}
                                        </span>
                                        <code className={`flex-1 font-mono text-xs ${state === 'declined' ? 'text-gray-500 line-through' : 'text-gray-200'
                                            }`}>
                                            {change.content}
                                        </code>

                                        {state === 'pending' && (
                                            <div className="flex gap-1 shrink-0">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 hover:bg-green-500/20"
                                                    onClick={() => handleLineAction(diffIdx, lineIdx, 'accept')}
                                                    title="Accept this change"
                                                >
                                                    <Check className="w-3 h-3 text-green-400" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 hover:bg-red-500/20"
                                                    onClick={() => handleLineAction(diffIdx, lineIdx, 'decline')}
                                                    title="Decline this change"
                                                >
                                                    <X className="w-3 h-3 text-red-400" />
                                                </Button>
                                            </div>
                                        )}

                                        {state === 'accepted' && (
                                            <div className="shrink-0 flex items-center gap-1">
                                                <Check className="w-4 h-4 text-green-400" />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-5 w-5 hover:bg-gray-500/20"
                                                    onClick={() => setLineStates(prev => ({ ...prev, [key]: 'pending' }))}
                                                    title="Undo"
                                                >
                                                    <X className="w-3 h-3 text-gray-400" />
                                                </Button>
                                            </div>
                                        )}

                                        {state === 'declined' && (
                                            <div className="shrink-0 flex items-center gap-1">
                                                <X className="w-4 h-4 text-gray-400" />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-5 w-5 hover:bg-gray-500/20"
                                                    onClick={() => setLineStates(prev => ({ ...prev, [key]: 'pending' }))}
                                                    title="Undo"
                                                >
                                                    <Check className="w-3 h-3 text-gray-400" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </ScrollArea>
        </Card>
    )
}
