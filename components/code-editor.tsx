"use client"

import * as React from "react"
import Editor, { EditorProps, OnMount } from "@monaco-editor/react"
import { cn } from "@/lib/utils"

interface CodeEditorProps extends EditorProps {
    className?: string
}

export function CodeEditor({ className, ...props }: CodeEditorProps) {
    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // You can configure the editor here
        // monaco.editor.defineTheme('my-theme', { ... })
    }

    return (
        <div className={cn("relative min-h-[500px] w-full overflow-hidden rounded-md border border-border bg-white", className)}>
            <Editor
                height="100%"
                defaultLanguage="python"
                defaultValue="# Write your python code here"
                theme="light"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'Fira Code', 'Satoshi', monospace",
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    roundedSelection: true,
                    automaticLayout: true,
                }}
                onMount={handleEditorDidMount}
                {...props}
            />
        </div>
    )
}
