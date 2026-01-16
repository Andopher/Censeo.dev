/**
 * Model Router - Selects appropriate model for task type
 * Following Cursor/Copilot pattern: stronger model for planning, faster for editing
 */

export type TaskType = 'plan' | 'edit';

export interface ModelConfig {
    name: string;
    description: string;
    costPerToken: number;
}

const MODELS: Record<TaskType, ModelConfig> = {
    plan: {
        name: 'gpt-5-mini-2025-08-07',
        description: 'Fast reasoning for planning and architecture',
        costPerToken: 0.000002 // Lower cost, still capable
    },
    edit: {
        name: 'gpt-5.1-codex-mini',
        description: 'Fast, efficient for code edits',
        costPerToken: 0.000001 // Lower cost, optimized for code
    }
};

/**
 * Select model based on task type
 */
export function selectModel(taskType: TaskType): string {
    return MODELS[taskType].name;
}

/**
 * Determine task type from user message
 */
export function inferTaskType(message: string): TaskType {
    const planKeywords = [
        'plan',
        'design',
        'architecture',
        'refactor',
        'restructure',
        'organize',
        'how should',
        'what approach',
        'multiple files'
    ];

    const lowerMessage = message.toLowerCase();

    for (const keyword of planKeywords) {
        if (lowerMessage.includes(keyword)) {
            return 'plan';
        }
    }

    return 'edit'; // Default to faster model
}

/**
 * Get model config
 */
export function getModelConfig(taskType: TaskType): ModelConfig {
    return MODELS[taskType];
}
