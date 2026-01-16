"use client"

import * as React from "react"
import Editor, { EditorProps, OnMount } from "@monaco-editor/react"
import { cn } from "@/lib/utils"
import type { editor } from "monaco-editor"
import type { DiffLine } from "@/lib/diff-parser"

interface CodeEditorProps extends EditorProps {
    className?: string
    pendingDiffs?: DiffLine[]
    onEditorReady?: (editor: editor.IStandaloneCodeEditor) => void
}

export function CodeEditor({ className, pendingDiffs, onEditorReady, ...props }: CodeEditorProps) {
    const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null)
    const decorationsRef = React.useRef<string[]>([])

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor
        if (onEditorReady) {
            onEditorReady(editor)
        }
    }

    // Apply diff decorations when pendingDiffs change
    React.useEffect(() => {
        if (!editorRef.current || !pendingDiffs || pendingDiffs.length === 0) {
            // Clear decorations if no diffs
            if (decorationsRef.current.length > 0) {
                decorationsRef.current = editorRef.current?.deltaDecorations(decorationsRef.current, []) || []
            }
            return
        }

        const decorations = pendingDiffs
            .filter(diff => diff.type !== 'context')
            .map(diff => {
                const lineNumber = diff.type === 'add' ? (diff.newLineNumber || 1) : (diff.originalLineNumber || 1)

                return {
                    range: new (window as any).monaco.Range(lineNumber, 1, lineNumber, 1),
                    options: {
                        isWholeLine: true,
                        className: diff.type === 'add' ? 'diff-line-add' : 'diff-line-remove',
                        glyphMarginClassName: diff.type === 'add' ? 'diff-glyph-add' : 'diff-glyph-remove',
                        linesDecorationsClassName: diff.type === 'add' ? 'diff-decoration-add' : 'diff-decoration-remove'
                    }
                }
            })

        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, decorations)
    }, [pendingDiffs])

    return (
        <div className={cn("relative min-h-[500px] w-full overflow-hidden border-none bg-[#1e1e1e]", className)}>
            <Editor
                height="100%"
                defaultLanguage="python"
                defaultValue="# Write your python code here"
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'Consolas', 'Courier New', monospace",
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    roundedSelection: true,
                    automaticLayout: true,
                    glyphMargin: true, // Enable glyph margin for +/- indicators
                }}
                onMount={handleEditorDidMount}
                {...props}
            />
        </div>
    )
}
