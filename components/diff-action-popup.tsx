"use client"

import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface DiffActionPopupProps {
    onAccept: () => void
    onReject: () => void
    changeCount: number
}

export function DiffActionPopup({ onAccept, onReject, changeCount }: DiffActionPopupProps) {
    return (
        <Card className="bg-[#252525] border border-border shadow-2xl rounded-lg px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="font-medium">
                    {changeCount} {changeCount === 1 ? 'change' : 'changes'} pending
                </span>
            </div>

            <div className="flex gap-2">
                <Button
                    onClick={onAccept}
                    className="bg-green-600 hover:bg-green-700 text-white h-8 px-4 text-sm"
                >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                </Button>
                <Button
                    onClick={onReject}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8 px-4 text-sm"
                >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                </Button>
            </div>
        </Card>
    )
}
