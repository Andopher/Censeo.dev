
export type QuestionType = 'forced_ranking' | 'multi_select' | 'binary_decision' | 'short_text';
export type TemplateType = 'frontend_engineer' | 'backend_engineer' | 'fullstack_engineer' | 'blank';

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
        type: 'frontend_engineer',
        title: 'Frontend Engineer Exam',
        description: 'Evaluate design thinking, UX judgment, and performance tradeoffs in frontend development.',
        defaultScenario: 'You\'re leading the redesign of an e-commerce product page that currently has a 12% conversion rate. The page loads 47 components, makes 23 API calls, and has a Time to Interactive of 4.2 seconds on 3G. Leadership wants "more interactivity" but the data shows 68% of users are on mobile with spotty connections.',
        questions: [
            {
                order: 1,
                type: 'forced_ranking',
                defaultPrompt: 'Rank these interventions by impact on conversion rate (most to least impactful):',
                constraints: {
                    options: [
                        'Reduce initial JavaScript bundle by 60%',
                        'Add a 3D product viewer with gesture controls',
                        'Implement skeleton screens for perceived performance',
                        'Remove the image carousel, show one hero image',
                        'Prefetch product data on category page hover'
                    ]
                }
            },
            {
                order: 2,
                type: 'short_text',
                defaultPrompt: 'The PM insists the new 3D viewer is "table stakes" because a competitor has it. How do you respond? Be specific about what data you\'d need or what compromise you\'d propose.',
            },
            {
                order: 3,
                type: 'binary_decision',
                defaultPrompt: 'You discover that 34% of users have JavaScript disabled or blocked. Do you:',
                constraints: {
                    yes_label: 'Build a no-JS fallback (adds 2 weeks)',
                    no_label: 'Show a "please enable JS" message'
                }
            },
            {
                order: 4,
                type: 'multi_select',
                defaultPrompt: 'Pick the 2 metrics you\'d track religiously for this redesign:',
                constraints: {
                    max_select: 2,
                    options: [
                        'Time to Interactive (TTI)',
                        'Conversion Rate',
                        'Bounce Rate',
                        'Lighthouse Score',
                        'Add-to-Cart Rate',
                        'Session Duration'
                    ]
                }
            },
            {
                order: 5,
                type: 'short_text',
                defaultPrompt: 'SURPRISE: After launch, conversion increases by 3%, but customer support tickets about "missing features" increase by 180%. The old page had 12 filters; you shipped with 4 "essential" ones. What happened, and what do you do?',
            }
        ]
    },
    {
        type: 'backend_engineer',
        title: 'Backend Engineer Exam',
        description: 'Assess systems thinking, scalability judgment, and operational maturity.',
        defaultScenario: 'You maintain an API that serves 50M requests/day. A new feature just shipped: users can now "follow" other users. Within 3 hours, the notifications service is melting down. Each "follow" event triggers notifications to followers-of-followers (virality feature). One power user with 2M followers just followed someone with 800k followers. Your DB has 9000 active connections (max is 10k). Average response time is 18 seconds.',
        questions: [
            {
                order: 1,
                type: 'forced_ranking',
                defaultPrompt: 'Rank your immediate actions (first to last):',
                constraints: {
                    options: [
                        'Kill the connection pool, restart the DB',
                        'Disable the virality feature via feature flag',
                        'Add a job queue (Redis/RabbitMQ) for async processing',
                        'Rate-limit notifications per user',
                        'Deploy a read replica for notification queries'
                    ]
                }
            },
            {
                order: 2,
                type: 'short_text',
                defaultPrompt: 'You disabled the virality feature. Users are furious on Twitter. The VP of Product is demanding you turn it back on. How do you explain the technical constraints to non-engineers without sounding like you\'re saying "no"?',
            },
            {
                order: 3,
                type: 'binary_decision',
                defaultPrompt: 'To ship a "safe" version faster, you could add a hard cap: max 10k notifications per follow event, silently dropping the rest. No user-facing error. Do you ship it?',
                constraints: {
                    yes_label: 'Ship the silent cap (fast, hides complexity)',
                    no_label: 'Show an error when cap is hit (slow, honest)'
                }
            },
            {
                order: 4,
                type: 'multi_select',
                defaultPrompt: 'For the long-term fix, which 2 approaches do you advocate for?',
                constraints: {
                    max_select: 2,
                    options: [
                        'Event-driven architecture with Kafka',
                        'GraphQL subscriptions for real-time delivery',
                        'Batch processing with cron jobs every 15 min',
                        'Fanout-on-write (pre-compute all timelines)',
                        'Fanout-on-read (compute on demand)'
                    ]
                }
            },
            {
                order: 5,
                type: 'short_text',
                defaultPrompt: 'Six months later, the CEO wants to add "AI-powered notification summaries" that require calling an LLM API ($0.002/request, 800ms P95 latency). This would apply to 30M notifications/day. What\'s your take? Be specific about costs, architecture, or trade-offs.',
            }
        ]
    },
    {
        type: 'fullstack_engineer',
        title: 'Full Stack Engineer Exam',
        description: 'Evaluate end-to-end product judgment, cross-layer tradeoffs, and ownership mentality.',
        defaultScenario: 'You\'re a founding engineer at a SaaS startup. The product is a collaborative whiteboard (think Miro/Figma-lite). You have 800 users, $40k MRR, and a 6-person team. A major enterprise prospect (potential $500k/year contract) demands: real-time collaboration for 200 concurrent users, SSO with SAML, and SOC2 compliance. Your current stack: Next.js, Supabase (Postgres), Vercel. Real-time is done with polling every 2 seconds. You have 8 weeks.',
        questions: [
            {
                order: 1,
                type: 'binary_decision',
                defaultPrompt: 'Do you take the enterprise deal?',
                constraints: {
                    yes_label: 'Yes, commit to 8 weeks (high risk, high reward)',
                    no_label: 'No, focus on product-market fit with SMBs'
                }
            },
            {
                order: 2,
                type: 'short_text',
                defaultPrompt: 'Defend your choice. What is the one assumption you\'re making that, if wrong, would make you regret this decision?',
            },
            {
                order: 3,
                type: 'multi_select',
                defaultPrompt: 'You took the deal. Pick 2 things to build in-house vs. buy/outsource:',
                constraints: {
                    max_select: 2,
                    options: [
                        'Real-time sync engine (WebSockets/CRDTs)',
                        'SAML SSO integration',
                        'SOC2 compliance documentation',
                        'Audit logging system',
                        'Advanced whiteboard features (for parity)'
                    ]
                }
            },
            {
                order: 4,
                type: 'short_text',
                defaultPrompt: 'Week 4: Your real-time system works, but only for 50 concurrent users before latency degrades. You discover the bottleneck is Postgres advisory locks. You have 4 weeks left. Walk me through your options and what you\'d actually do.',
            },
            {
                order: 5,
                type: 'forced_ranking',
                defaultPrompt: 'Week 7: You\'re behind schedule. Rank what you\'d cut or compromise (first = first to cut):',
                constraints: {
                    options: [
                        'SOC2 audit (get the docs, delay the audit)',
                        'Real-time for 200 users (ship for 100, promise 200 later)',
                        'SAML SSO (use Google OAuth + manual provisioning)',
                        'Existing features (remove video chat, comments)',
                        'Code quality (accrue tech debt, ship it messy)'
                    ]
                }
            },
            {
                order: 6,
                type: 'short_text',
                defaultPrompt: 'FINAL QUESTION: You shipped. The enterprise client is happy. But 3 of your original 800 users churned, citing "the app feels bloated now." Your NPS dropped from 62 to 44. What happened, and how do you prevent this next time?',
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
