
export type QuestionType = 'forced_ranking' | 'multi_select' | 'binary_decision' | 'short_text';
export type TemplateType = 'senior_frontend' | 'senior_backend' | 'senior_fullstack' | 'junior_frontend' | 'junior_backend' | 'junior_fullstack' | 'blank';

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
        type: 'senior_frontend',
        title: 'Senior Frontend Engineer',
        description: 'Evaluate design thinking, UX judgment, and performance tradeoffs in frontend development.',
        defaultScenario: 'You\'re leading the redesign of an e-commerce product page that currently has a 12% conversion rate. The page loads 47 components, makes 23 API calls, and has a Time to Interactive of 4.2 seconds on 3G. Leadership wants "more interactivity" but the data shows 68% of users are on mobile with spotty connections.',
        questions: [
            {
                order: 1,
                type: 'forced_ranking',
                defaultPrompt: 'Rank these interventions by impact on conversion rate. You must prioritize TTI over aesthetics.',
                constraints: {
                    options: [
                        'Reduce initial JavaScript bundle by 60%',
                        'Remove the image carousel (save 1.2MB)',
                        'Implement skeleton screens (perceived speed only)',
                        'Add 3D product viewer (marketing request)',
                        'Prefetch data on hover'
                    ]
                }
            },
            {
                order: 2,
                type: 'binary_decision',
                defaultPrompt: 'The PM insists the new 3D viewer is "table stakes". It adds 1.5s to the load time. Do you build it?',
                constraints: {
                    yes_label: 'Yes, build it (Impact: Slower TTI)',
                    no_label: 'No, refuse it (Impact: PM conflict)'
                }
            },
            {
                order: 3,
                type: 'binary_decision',
                defaultPrompt: 'You discover 34% of users have JavaScript disabled/fail. You have 2 days until launch. Do you build a no-JS fallback?',
                constraints: {
                    yes_label: 'Yes (Skip other QA to finish fallback)',
                    no_label: 'No (Show "Please enable JS" error)'
                }
            },
            {
                order: 4,
                type: 'multi_select',
                defaultPrompt: 'Pick exactly 2 metrics that determine if this redesign is a failure. No vanilla "Conversion Rate".',
                constraints: {
                    max_select: 2,
                    options: [
                        'Time to Interactive (TTI)',
                        'Bounce Rate on 3G Networks',
                        'Add-to-Cart Click Latency',
                        'Lighthouse Accessibility Score',
                        'Customer Acquisition Cost',
                        'Total Page Weight'
                    ]
                }
            },
            {
                order: 5,
                type: 'short_text',
                defaultPrompt: 'SURPRISE: Conversion increased 3%, but support tickets spiked 180%. You cut the "Advanced Filters" to save time. What is the single specific action you take in the next hour? (Max 2 sentences)',
            }
        ]
    },
    {
        type: 'senior_backend',
        title: 'Senior Backend Engineer',
        description: 'Assess systems thinking, scalability judgment, and operational maturity.',
        defaultScenario: 'You maintain an API that serves 50M requests/day. A new feature just shipped: users can now "follow" other users. Within 3 hours, the notifications service is melting down. Each "follow" event triggers notifications to followers-of-followers (virality feature). One power user with 2M followers just followed someone with 800k followers. Your DB has 9000 active connections (max is 10k). Average response time is 18 seconds.',
        questions: [
            {
                order: 1,
                type: 'forced_ranking',
                defaultPrompt: 'Rank your immediate actions (first = do immediately):',
                constraints: {
                    options: [
                        'Kill the connection pool (Will drop 100% of current reqs)',
                        'Disable virality feature (Feature flag)',
                        'Deploy read replica (Takes 15 mins)',
                        'Rate-limit notifications (Code change + deploy)',
                        'Ignore and let it stabilize'
                    ]
                }
            },
            {
                order: 2,
                type: 'binary_decision',
                defaultPrompt: 'You disabled the virality feature. The VP of Product screams "Turn it back on NOW, we are losing momentum!" The DB is still at 90% CPU. Do you re-enable it?',
                constraints: {
                    yes_label: 'Yes (Risk total outage)',
                    no_label: 'No (Risk being fired)'
                }
            },
            {
                order: 3,
                type: 'binary_decision',
                defaultPrompt: 'To ship a "safe" version, you add a cap: max 10k notifications/event. Excess are silently dropped. Users wont know. Do you ship this?',
                constraints: {
                    yes_label: 'Ship it (dishonest but stable)',
                    no_label: 'Don\'t ship (honest but broken)'
                }
            },
            {
                order: 4,
                type: 'multi_select',
                defaultPrompt: 'Pick exactly 1 architecture change for next week. You cannot pick "Event-driven" (takes too long).',
                constraints: {
                    max_select: 1,
                    options: [
                        'GraphQL Subscriptions (Complex)',
                        'Fanout-on-read (Compute intensive)',
                        'Fanout-on-write (Storage intensive)',
                        'Batch processing (High latency)'
                    ]
                }
            },
            {
                order: 5,
                type: 'binary_decision',
                defaultPrompt: 'CEO wants "AI Summaries". Cost: $0.002/req. Vol: 30M req/day. Budget: $10k/month. Do you approve this?',
                constraints: {
                    yes_label: 'Yes (I can optimize costs later)',
                    no_label: 'No (Math says $1.8M/month)'
                }
            }
        ]
    },
    {
        type: 'senior_fullstack',
        title: 'Senior Full Stack Engineer',
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
        type: 'junior_frontend',
        title: 'Junior Frontend Engineer',
        description: 'Evaluate core frontend skills, debugging approach, and learning mindset.',
        defaultScenario: 'You\'re working on a marketing landing page for a new product launch. The page has a hero section, a feature comparison table, and a contact form. Your team lead reviewed your PR and left feedback: "The page looks great on desktop, but on mobile the contact form is cut off and the table scrolls horizontally. Also, the hero image is 4MB and the page takes 8 seconds to load on 3G."',
        questions: [
            {
                order: 1,
                type: 'multi_select',
                defaultPrompt: 'Which 2 issues drastically impact the user (ignore "nice to haves")?',
                constraints: {
                    max_select: 2,
                    options: [
                        'Mobile form cut off (Functional blocker)',
                        'Page load 8s (Performance blocker)',
                        'Table scrolls horizontally (UX annoyance)',
                        'Hero image size (Root cause)',
                        'Lack of animations'
                    ]
                }
            },
            {
                order: 2,
                type: 'multi_select',
                defaultPrompt: 'You must reduce the hero image size below 100KB. Which SINGLE format do you choose?',
                constraints: {
                    max_select: 1,
                    options: [
                        'WebP (Modern, high compression)',
                        'PNG (Lossless, heavy)',
                        'JPEG (Lossy, standard)',
                        'SVG (Vector, unrelated)'
                    ]
                }
            },
            {
                order: 3,
                type: 'binary_decision',
                defaultPrompt: 'For the mobile table, you have 4 hours. Do you:',
                constraints: {
                    yes_label: 'Allow horizontal scroll (Takes 10 mins)',
                    no_label: 'Redesign as stacked cards (Takes 6 hours)'
                }
            },
            {
                order: 4,
                type: 'binary_decision',
                defaultPrompt: 'Validation is annoying. When should the error message appear?',
                constraints: {
                    yes_label: 'On Blur (When they leave the field)',
                    no_label: 'On Change (Every keystroke)'
                }
            },
            {
                order: 5,
                type: 'forced_ranking',
                defaultPrompt: 'Rank these animations by importance (Functional > Delight):',
                constraints: {
                    options: [
                        'Form success confirmation',
                        'Button hover effects',
                        'Smooth scroll',
                        'Fade-in feature cards',
                        'Page load spinner'
                    ]
                }
            }
        ]
    },
    {
        type: 'junior_backend',
        title: 'Junior Backend Engineer',
        description: 'Assess problem-solving, API design basics, and error handling skills.',
        defaultScenario: 'You\'re building a REST API. A user reports: "When I try to add a comment to a post that doesn\'t exist, I get a 500 error." Logs show: `TypeError: Cannot read property \'comments\' of null`.',
        questions: [
            {
                order: 1,
                type: 'binary_decision',
                defaultPrompt: 'What status code do you return when the post is missing?',
                constraints: {
                    yes_label: '404 Not Found (Correct resource missing)',
                    no_label: '400 Bad Request (Client error)'
                }
            },
            {
                order: 2,
                type: 'short_text',
                defaultPrompt: 'The bug is a missing null check. Write the ONE line of code you add to fix this.',
            },
            {
                order: 3,
                type: 'binary_decision',
                defaultPrompt: 'API takes 3s to load 500 comments. You can only do one fix. Which one?',
                constraints: {
                    yes_label: 'Add Pagination (Load 50 at a time)',
                    no_label: 'Cache in Redis (Fast but complex)'
                }
            },
            {
                order: 4,
                type: 'binary_decision',
                defaultPrompt: 'User submits a 10,000 char comment. DB limit is usually text (unlimited) but UI breaks. Do you truncate it?',
                constraints: {
                    yes_label: 'Yes, truncate at 500 chars (Data loss)',
                    no_label: 'No, reject request with 400 error (User friction)'
                }
            },
            {
                order: 5,
                type: 'forced_ranking',
                defaultPrompt: 'Rank these auth tasks by security priority (first = critical):',
                constraints: {
                    options: [
                        'Hash passwords (bcrypt)',
                        'Add rate limiting',
                        'Implement Forgot Password',
                        'Add Google OAuth',
                        'Build Admin Dashboard'
                    ]
                }
            }
        ]
    },
    {
        type: 'junior_fullstack',
        title: 'Junior Full Stack Engineer',
        description: 'Test end-to-end feature development, debugging across layers, and user empathy.',
        defaultScenario: 'You\'re building a "favorites" feature for a recipe app. Users can click a heart icon to save recipes. You built the UI (heart icon toggles on click), the API endpoint (POST /favorites), and the database table. But users are reporting: "When I favorite a recipe and refresh the page, the heart is empty again." You check and realize you forgot to fetch the user\'s favorites on page load.',
        questions: [
            {
                order: 1,
                type: 'binary_decision',
                defaultPrompt: 'Where should you fetch the user\'s favorites list?',
                constraints: {
                    yes_label: 'On root/page load (Fetch once, global state)',
                    no_label: 'On each recipe (Fetch repeatedly, fresh data)'
                }
            },
            {
                order: 2,
                type: 'binary_decision',
                defaultPrompt: 'API Design: GET /favorites returns list of IDs or full Recipe objects?',
                constraints: {
                    yes_label: 'IDs only (Small payload, requires N+1 or bulk fetch)',
                    no_label: 'Full Objects (Heavy payload, instant UI)'
                }
            },
            {
                order: 3,
                type: 'binary_decision',
                defaultPrompt: 'When clicking heart, do you wait for server?',
                constraints: {
                    yes_label: 'Optimistic (Instant UI, risk rollback)',
                    no_label: 'Loading State (Slow UI, guaranteed truth)'
                }
            },
            {
                order: 4,
                type: 'binary_decision',
                defaultPrompt: 'User clicks rapidly (5 times). Which technique prevents 5 API calls?',
                constraints: {
                    yes_label: 'Debounce (Wait for pause)',
                    no_label: 'Throttle (Limit rate)'
                }
            },
            {
                order: 5,
                type: 'forced_ranking',
                defaultPrompt: 'PM wants features. Rank by impact on retention:',
                constraints: {
                    options: [
                        'Add email notifications for new recipes',
                        'Show "favorited by X people" count',
                        'Add a "My Favorites" page',
                        'Fix offline un-favoriting bug',
                        'Folders for favorites'
                    ]
                }
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
