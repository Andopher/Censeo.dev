import path from 'path';
import crypto from 'crypto';
import type { Change, ValidationResult, FileState } from './patch-schema';
import fs from 'fs/promises';

/**
 * Validates patch proposals for safety and correctness
 */
export class PatchValidator {
    private workspaceDir: string;
    private fileStates: Map<string, FileState>;

    constructor(workspaceDir: string) {
        this.workspaceDir = workspaceDir;
        this.fileStates = new Map();
    }

    /**
     * Normalize and validate path safety
     */
    normalizePath(filePath: string): string {
        const normalized = path.normalize(filePath);
        const resolved = path.resolve(this.workspaceDir, normalized);

        // Ensure path is within workspace
        if (!resolved.startsWith(this.workspaceDir)) {
            throw new Error(`Path traversal detected: ${filePath}`);
        }

        return path.relative(this.workspaceDir, resolved);
    }

    /**
     * Check if path is safe (no ../ attacks)
     */
    isPathSafe(filePath: string): boolean {
        try {
            this.normalizePath(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Generate checksum for file content
     */
    generateChecksum(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Record file read with checksum
     */
    recordFileRead(filePath: string, content: string): void {
        const checksum = this.generateChecksum(content);
        this.fileStates.set(filePath, {
            path: filePath,
            checksum,
            lastRead: Date.now()
        });
    }

    /**
     * Check if file has changed since last read
     */
    async hasFileChanged(filePath: string): Promise<boolean> {
        const state = this.fileStates.get(filePath);
        if (!state) return false;

        try {
            const fullPath = path.join(this.workspaceDir, filePath);
            const currentContent = await fs.readFile(fullPath, 'utf8');
            const currentChecksum = this.generateChecksum(currentContent);
            return currentChecksum !== state.checksum;
        } catch {
            return true; // File doesn't exist or can't be read
        }
    }

    /**
     * Validate a single change
     */
    async validateChange(change: Change): Promise<ValidationResult> {
        const errors: string[] = [];

        // Validate path safety
        if (!this.isPathSafe(change.path)) {
            errors.push(`Unsafe path: ${change.path}`);
            return { valid: false, errors };
        }

        const normalizedPath = this.normalizePath(change.path);
        const fullPath = path.join(this.workspaceDir, normalizedPath);

        try {
            const fileExists = await fs.access(fullPath).then(() => true).catch(() => false);

            switch (change.operation) {
                case 'modify':
                    if (!fileExists) {
                        errors.push(`Cannot modify non-existent file: ${change.path}`);
                    }
                    if (!change.diff) {
                        errors.push(`Modify operation requires diff: ${change.path}`);
                    }
                    // Check for stale diff
                    if (await this.hasFileChanged(normalizedPath)) {
                        errors.push(`File has changed since last read: ${change.path}`);
                    }
                    break;

                case 'create':
                    if (fileExists) {
                        errors.push(`Cannot create existing file: ${change.path}`);
                    }
                    if (!change.content) {
                        errors.push(`Create operation requires content: ${change.path}`);
                    }
                    break;

                case 'delete':
                    if (!fileExists) {
                        errors.push(`Cannot delete non-existent file: ${change.path}`);
                    }
                    break;

                default:
                    errors.push(`Unknown operation: ${change.operation}`);
            }
        } catch (error) {
            errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate all changes in a proposal
     */
    async validateProposal(changes: Change[]): Promise<ValidationResult> {
        const allErrors: string[] = [];

        for (const change of changes) {
            const result = await this.validateChange(change);
            if (!result.valid) {
                allErrors.push(...result.errors);
            }
        }

        return {
            valid: allErrors.length === 0,
            errors: allErrors
        };
    }
}
