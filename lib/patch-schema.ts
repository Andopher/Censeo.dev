/**
 * Patch Schema - Structured output format for AI agent
 * Based on Cursor-style architecture
 */

export type OperationType = 'modify' | 'create' | 'delete';

export interface Change {
    path: string;
    operation: OperationType;
    diff?: string;      // Required for 'modify' - unified diff format
    content?: string;   // Required for 'create' - full file content
}

export interface PatchProposal {
    changes: Change[];
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export interface ApplyResult {
    success: boolean;
    path: string;
    error?: string;
}

export interface FileState {
    path: string;
    checksum: string;
    lastRead: number;
}

export interface SessionState {
    filesRead: Map<string, FileState>;
    filesModified: Set<string>;
    changeLog: ChangeLogEntry[];
    startTime: number;
}

export interface ChangeLogEntry {
    timestamp: number;
    path: string;
    operation: OperationType;
    checksum: string;
}
