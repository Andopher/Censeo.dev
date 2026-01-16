import fs from 'fs/promises';
import path from 'path';
import type { Change, ApplyResult } from './patch-schema';

/**
 * Applies patches atomically with rollback capability
 */
export class PatchApplier {
    private workspaceDir: string;
    private appliedChanges: Array<{ path: string; backup: string }> = [];

    constructor(workspaceDir: string) {
        this.workspaceDir = workspaceDir;
    }

    /**
     * Apply a unified diff to original content
     */
    applyUnifiedDiff(original: string, diff: string): string {
        const originalLines = original.split('\n');
        const result: string[] = [];

        const diffLines = diff.split('\n');
        let originalIndex = 0;

        for (const line of diffLines) {
            if (line.startsWith('@@')) {
                // Parse hunk header: @@ -start,count +start,count @@
                continue;
            } else if (line.startsWith('+')) {
                // Addition
                result.push(line.substring(1));
            } else if (line.startsWith('-')) {
                // Deletion - skip the line
                originalIndex++;
            } else if (line.startsWith(' ')) {
                // Context line
                if (originalIndex < originalLines.length) {
                    result.push(originalLines[originalIndex]);
                    originalIndex++;
                }
            }
        }

        // Add remaining lines
        while (originalIndex < originalLines.length) {
            result.push(originalLines[originalIndex]);
            originalIndex++;
        }

        return result.join('\n');
    }

    /**
     * Apply a single change
     */
    async applyChange(change: Change): Promise<ApplyResult> {
        const fullPath = path.join(this.workspaceDir, change.path);

        try {
            switch (change.operation) {
                case 'modify': {
                    // Backup original
                    const original = await fs.readFile(fullPath, 'utf8');
                    this.appliedChanges.push({ path: change.path, backup: original });

                    // Apply diff
                    if (!change.diff) {
                        throw new Error('Diff required for modify operation');
                    }
                    const modified = this.applyUnifiedDiff(original, change.diff);

                    // Write modified content
                    await fs.writeFile(fullPath, modified, 'utf8');
                    break;
                }

                case 'create': {
                    // Ensure directory exists
                    await fs.mkdir(path.dirname(fullPath), { recursive: true });

                    // Write new file
                    if (!change.content) {
                        throw new Error('Content required for create operation');
                    }
                    await fs.writeFile(fullPath, change.content, 'utf8');
                    this.appliedChanges.push({ path: change.path, backup: '' });
                    break;
                }

                case 'delete': {
                    // Backup before delete
                    const original = await fs.readFile(fullPath, 'utf8');
                    this.appliedChanges.push({ path: change.path, backup: original });

                    // Delete file
                    await fs.unlink(fullPath);
                    break;
                }

                default:
                    throw new Error(`Unknown operation: ${change.operation}`);
            }

            return {
                success: true,
                path: change.path
            };
        } catch (error) {
            return {
                success: false,
                path: change.path,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Apply all changes atomically
     * Rolls back on first failure
     */
    async applyChanges(changes: Change[]): Promise<ApplyResult[]> {
        const results: ApplyResult[] = [];

        for (const change of changes) {
            const result = await this.applyChange(change);
            results.push(result);

            if (!result.success) {
                // Rollback all applied changes
                await this.rollback();
                break;
            }
        }

        return results;
    }

    /**
     * Rollback all applied changes
     */
    async rollback(): Promise<void> {
        console.log('[ROLLBACK] Rolling back changes...');

        for (const { path: filePath, backup } of this.appliedChanges.reverse()) {
            const fullPath = path.join(this.workspaceDir, filePath);

            try {
                if (backup === '') {
                    // Was a create - delete it
                    await fs.unlink(fullPath);
                } else {
                    // Was a modify or delete - restore backup
                    await fs.writeFile(fullPath, backup, 'utf8');
                }
            } catch (error) {
                console.error(`[ROLLBACK ERROR] Failed to rollback ${filePath}:`, error);
            }
        }

        this.appliedChanges = [];
    }

    /**
     * Clear backup history (call after successful commit)
     */
    clearBackups(): void {
        this.appliedChanges = [];
    }
}
