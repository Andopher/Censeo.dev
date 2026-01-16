export interface DiffLine {
    type: 'add' | 'remove' | 'context';
    content: string;
    originalLineNumber?: number;
    newLineNumber?: number;
}

export interface FileDiff {
    filename: string;
    changes: DiffLine[];
}

/**
 * Parses AI-generated diff suggestions from markdown code blocks
 * Expected format:
 * ```diff-suggestion
 * FILE: filename.py
 * ---
 * - old line to remove
 * + new line to add
 *   unchanged line
 * ```
 */
export function parseDiffSuggestion(markdown: string): FileDiff[] {
    const diffBlocks = markdown.match(/```diff-suggestion\n([\s\S]*?)```/g);
    if (!diffBlocks) return [];

    return diffBlocks.map(block => {
        const lines = block.split('\n').slice(1, -1); // Remove ``` markers
        const fileMatch = lines[0]?.match(/FILE:\s*(.+)/);
        const filename = fileMatch ? fileMatch[1].trim() : 'unknown';

        const changes: DiffLine[] = [];
        let originalLineNum = 1;
        let newLineNum = 1;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || line.startsWith('---')) continue; // Skip separator

            if (line.startsWith('+')) {
                changes.push({
                    type: 'add',
                    content: line.slice(2),
                    newLineNumber: newLineNum++
                });
            } else if (line.startsWith('-')) {
                changes.push({
                    type: 'remove',
                    content: line.slice(2),
                    originalLineNumber: originalLineNum++
                });
            } else if (line.startsWith(' ')) {
                changes.push({
                    type: 'context',
                    content: line.slice(2),
                    originalLineNumber: originalLineNum++,
                    newLineNumber: newLineNum++
                });
            }
        }

        return { filename, changes };
    });
}

/**
 * Applies accepted diff changes to file content
 * This function properly handles additions, deletions, and context matching
 */
export function applyDiffChanges(originalContent: string, acceptedChanges: DiffLine[]): string {
    const originalLines = originalContent.split('\n');
    const result: string[] = [];

    let originalIndex = 0;
    let i = 0;

    while (i < acceptedChanges.length) {
        const change = acceptedChanges[i];

        if (change.type === 'context') {
            // Context line - find and copy from original
            const contextContent = change.content.trim();

            // Search forward in original for matching context
            while (originalIndex < originalLines.length) {
                if (originalLines[originalIndex].trim() === contextContent) {
                    result.push(originalLines[originalIndex]);
                    originalIndex++;
                    break;
                }
                originalIndex++;
            }
            i++;
        } else if (change.type === 'add') {
            // Addition - just add the new line
            result.push(change.content);
            i++;
        } else if (change.type === 'remove') {
            // Deletion - skip the line in original
            const removeContent = change.content.trim();

            // Find and skip the line to remove
            while (originalIndex < originalLines.length) {
                if (originalLines[originalIndex].trim() === removeContent) {
                    originalIndex++; // Skip this line
                    break;
                }
                originalIndex++;
            }
            i++;
        }
    }

    // Add any remaining lines from original that weren't processed
    while (originalIndex < originalLines.length) {
        result.push(originalLines[originalIndex]);
        originalIndex++;
    }

    return result.join('\n');
}
