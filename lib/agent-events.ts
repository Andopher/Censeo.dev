/**
 * Agent Event Types for UX streaming
 * Separates model output from patch application
 */

export type AgentEvent =
    | { type: 'reading_file'; path: string }
    | { type: 'proposing_change'; path: string; operation: string }
    | { type: 'validating_patch'; path: string }
    | { type: 'applying_patch'; path: string }
    | { type: 'patch_applied'; path: string; success: true }
    | { type: 'patch_failed'; path: string; error: string }
    | { type: 'validation_failed'; errors: string[] }
    | { type: 'rollback_started' }
    | { type: 'rollback_complete' }
    | { type: 'done'; summary: string };

export interface EventEmitter {
    emit(event: AgentEvent): void;
}

export class StreamEventEmitter implements EventEmitter {
    constructor(private writeStream: (data: string) => void) { }

    emit(event: AgentEvent): void {
        // Send event as JSON line
        this.writeStream(JSON.stringify(event) + '\n');
    }
}
