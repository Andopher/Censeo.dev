import crypto from 'crypto';
import type { ChangeLogEntry, FileState, SessionState } from './patch-schema';

/**
 * Manages file state across requests
 * Tracks reads, modifications, and maintains change log
 */
export class FileStateManager {
    private sessions: Map<string, SessionState> = new Map();

    /**
     * Create or get session
     */
    getSession(sessionId: string): SessionState {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                filesRead: new Map(),
                filesModified: new Set(),
                changeLog: [],
                startTime: Date.now()
            });
        }
        return this.sessions.get(sessionId)!;
    }

    /**
     * Generate checksum for content
     */
    generateChecksum(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Record file read
     */
    recordRead(sessionId: string, path: string, content: string): void {
        const session = this.getSession(sessionId);
        const checksum = this.generateChecksum(content);

        session.filesRead.set(path, {
            path,
            checksum,
            lastRead: Date.now()
        });
    }

    /**
     * Record file modification
     */
    recordModify(sessionId: string, path: string, newContent: string, operation: 'modify' | 'create' | 'delete'): void {
        const session = this.getSession(sessionId);
        const checksum = this.generateChecksum(newContent);

        session.filesModified.add(path);
        session.changeLog.push({
            timestamp: Date.now(),
            path,
            operation,
            checksum
        });
    }

    /**
     * Get file state
     */
    getFileState(sessionId: string, path: string): FileState | undefined {
        const session = this.getSession(sessionId);
        return session.filesRead.get(path);
    }

    /**
     * Check if file has been modified in session
     */
    wasModified(sessionId: string, path: string): boolean {
        const session = this.getSession(sessionId);
        return session.filesModified.has(path);
    }

    /**
     * Get change log for session
     */
    getChangeLog(sessionId: string): ChangeLogEntry[] {
        const session = this.getSession(sessionId);
        return [...session.changeLog];
    }

    /**
     * Clear session
     */
    clearSession(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    /**
     * Get all sessions (for debugging)
     */
    getAllSessions(): string[] {
        return Array.from(this.sessions.keys());
    }

    /**
     * Cleanup old sessions (older than 1 hour)
     */
    cleanupOldSessions(): void {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.startTime < oneHourAgo) {
                this.sessions.delete(sessionId);
            }
        }
    }
}

// Singleton instance
export const fileStateManager = new FileStateManager();
