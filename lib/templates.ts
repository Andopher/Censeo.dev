
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
        type: 'senior_backend',
        title: 'Senior Backend Engineer',
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
                defaultPrompt: 'Which 2 issues would you fix first?',
                constraints: {
                    max_select: 2,
                    options: [
                        'Fix the mobile contact form layout',
                        'Optimize the hero image size',
                        'Make the table responsive',
                        'Add loading states',
                        'Test on different browsers'
                    ]
                }
            },
            {
                order: 2,
                type: 'short_text',
                defaultPrompt: 'How would you optimize the 4MB hero image? Be specific about the technique(s) you\'d use.',
            },
            {
                order: 3,
                type: 'binary_decision',
                defaultPrompt: 'For the comparison table on mobile, would you:',
                constraints: {
                    yes_label: 'Allow horizontal scroll (simple)',
                    no_label: 'Redesign as stacked cards (complex but better UX)'
                }
            },
            {
                order: 4,
                type: 'short_text',
                defaultPrompt: 'Your form validation only runs on submit, so users don\'t see errors until they click "Submit". A user complains it feels "broken". How would you improve this?',
            },
            {
                order: 5,
                type: 'forced_ranking',
                defaultPrompt: 'Your team lead suggests adding animations. Rank these by importance (most to least):',
                constraints: {
                    options: [
                        'Smooth scroll to form section',
                        'Fade-in for feature cards',
                        'Button hover effects',
                        'Page load animation',
                        'Form success confirmation'
                    ]
                }
            }
        ]
    },
    {
        type: 'junior_backend',
        title: 'Junior Backend Engineer',
        description: 'Assess problem-solving, API design basics, and error handling skills.',
        defaultScenario: 'You\'re building a REST API for a blog platform. The API has endpoints for creating posts, fetching posts, and adding comments. A user reports: "When I try to add a comment to a post that doesn\'t exist, I get a 500 error and the app crashes." You check the logs and see: `TypeError: Cannot read property \'comments\' of null`.',
        questions: [
            {
                order: 1,
                type: 'binary_decision',
                defaultPrompt: 'What HTTP status code should you return when a post doesn\'t exist?',
                constraints: {
                    yes_label: '404 Not Found',
                    no_label: '400 Bad Request'
                }
            },
            {
                order: 2,
                type: 'short_text',
                defaultPrompt: 'Write pseudocode or describe how you\'d fix this bug. What would you check before trying to add the comment?',
            },
            {
                order: 3,
                type: 'multi_select',
                defaultPrompt: 'Your API endpoint takes 3 seconds to load a post with 500 comments. Pick 2 ways to improve this:',
                constraints: {
                    max_select: 2,
                    options: [
                        'Add pagination to comments (e.g., load 50 at a time)',
                        'Cache the entire response in Redis',
                        'Add database indexes on post_id',
                        'Use GraphQL instead of REST',
                        'Load comments in a separate API call'
                    ]
                }
            },
            {
                order: 4,
                type: 'short_text',
                defaultPrompt: 'A user submits a comment with a 10,000-character essay (your UI only shows 500 chars). Should you store all 10,000 characters in the database? Why or why not?',
            },
            {
                order: 5,
                type: 'forced_ranking',
                defaultPrompt: 'You need to add authentication. Rank these by implementation priority (first to last):',
                constraints: {
                    options: [
                        'Hash passwords before storing them',
                        'Add rate limiting to login endpoint',
                        'Implement "Forgot Password" flow',
                        'Add Google OAuth login',
                        'Create admin vs. user roles'
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
                    yes_label: 'On page load (fetch once, store in state)',
                    no_label: 'Every time they view a recipe (fetch per recipe)'
                }
            },
            {
                order: 2,
                type: 'short_text',
                defaultPrompt: 'Describe how you\'d structure the API response for GET /favorites. What data would you include?',
            },
            {
                order: 3,
                type: 'multi_select',
                defaultPrompt: 'When a user clicks the heart icon, what should happen? (Pick 2)',
                constraints: {
                    max_select: 2,
                    options: [
                        'Update the UI immediately (optimistic update)',
                        'Show a loading spinner until API responds',
                        'Send POST request to server',
                        'Wait for server response before updating UI',
                        'Store favorite in localStorage as backup'
                    ]
                }
            },
            {
                order: 4,
                type: 'short_text',
                defaultPrompt: 'A user clicks the heart icon 5 times rapidly (on/off/on/off/on). How would you prevent sending 5 API requests?',
            },
            {
                order: 5,
                type: 'forced_ranking',
                defaultPrompt: 'Your PM asks for these features next. Rank by what you\'d build first (top = first):',
                constraints: {
                    options: [
                        'Show "favorited by X people" count',
                        'Add a "My Favorites" page',
                        'Fix the bug where unfavoriting doesn\'t work offline',
                        'Let users organize favorites into folders',
                        'Add email notifications for new recipes from favorited chefs'
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
