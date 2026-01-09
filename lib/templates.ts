
export type QuestionType = 'forced_ranking' | 'multi_select' | 'binary_decision' | 'short_text';
export type TemplateType = 'production_incident' | 'system_tradeoff' | 'code_review' | 'blank';

export interface TemplateQuestion {
    order: number;
    type: QuestionType;
    defaultPrompt: string;
    constraints?: Record<string, any>; // e.g., { options: [], max_select: 2 }
}

export interface TemplateDef {
    type: TemplateType;
    title: string;
    description: string;
    defaultScenario: string;
    questions: TemplateQuestion[];
}

export const TEMPLATES: TemplateDef[] = [
    {
        type: 'production_incident',
        title: 'Production Incident',
        description: 'Evaluate how a candidate prioritizes and communicates during a live outage.',
        defaultScenario: 'You are the on-call engineer for the payments service. At 14:00, you receive an alert: "High Error Rate in Checkout API (5xx > 10%)".',
        questions: [
            {
                order: 1,
                type: 'forced_ranking',
                defaultPrompt: 'Rank your immediate next steps in order of priority.',
                constraints: {
                    options: ['Check logs', 'Rollback last deployment', 'Notify stakeholders', 'Check database metrics', 'Attempt to reproduce']
                }
            },
            {
                order: 2,
                type: 'multi_select',
                defaultPrompt: 'Which 2 dashboards would you open first?',
                constraints: {
                    max_select: 2,
                    options: ['Latenceny/Throughput', 'Error Logs', 'CPU/Memory', 'Database Connections', 'Load Balancer']
                }
            },
            {
                order: 3,
                type: 'short_text',
                defaultPrompt: 'UPDATE: The error logs show connection timeouts to the external fraud detection provider. What is your hypothesis and next action?',
            },
            {
                order: 4,
                type: 'binary_decision',
                defaultPrompt: 'Do you disable fraud checks to restore payment flow, risking some fraudulent transactions?',
                constraints: {
                    yes_label: 'Disable Fraud Checks (Fail Open)',
                    no_label: 'Keep Checks (Fail Closed)'
                }
            },
            {
                order: 5,
                type: 'short_text',
                defaultPrompt: 'Reflection: How would you prevent this tradeoff in the future?',
            }
        ]
    },
    {
        type: 'system_tradeoff',
        title: 'System Tradeoff',
        description: 'Assess architectural decision making under constraints.',
        defaultScenario: 'We need to design a notification system for a ride-sharing app.',
        questions: [
            {
                order: 1,
                type: 'short_text',
                defaultPrompt: 'Describe your high-level approach (max 3 sentences).',
            },
            {
                order: 2,
                type: 'multi_select',
                defaultPrompt: 'CONSTRAINT: The system must handle 100k events/sec, but message ordering is strict. Pick 1 technology.',
                constraints: {
                    max_select: 1,
                    options: ['Kafka (Partitioned)', 'RabbitMQ', 'Redis Pub/Sub', 'Postgres Queue']
                }
            },
            {
                order: 3,
                type: 'short_text',
                defaultPrompt: 'Defend your choice against the alternatives you excluded.',
            },
            {
                order: 4,
                type: 'binary_decision',
                defaultPrompt: 'Would you sacrifice strict ordering to reduce latency by 50%?',
                constraints: {
                    yes_label: 'Sacrifice Ordering',
                    no_label: 'Maintain Strict Ordering'
                }
            }
        ]
    },
    {
        type: 'code_review',
        title: 'Code Review Without Code',
        description: 'Evaluate focus on maintainability, risk, and business requirements.',
        defaultScenario: 'PR: "Refactor User Authentication to use new XYZ Service".\n\nDescription: This PR keeps the old auth active as a fallback but migrates 10% of traffic to the new service.',
        questions: [
            {
                order: 1,
                type: 'binary_decision',
                defaultPrompt: 'Decision on this PR:',
                constraints: {
                    yes_label: 'Approve',
                    no_label: 'Request Changes / Block'
                }
            },
            {
                order: 2,
                type: 'short_text',
                defaultPrompt: 'Justify your risk assessment. What is the biggest danger here?',
            },
            {
                order: 3,
                type: 'short_text',
                defaultPrompt: 'What one change would make you reverse your decision?',
            }
        ]
    },
    {
        type: 'blank',
        title: 'Blank Template',
        description: 'Start from scratch. Build your own interview flow.',
        defaultScenario: 'Define your scenario here...',
        questions: []
    }
];
