import type { PatchProposal } from './patch-schema';

/**
 * Plan-Execute-Validate workflow
 * Implements Cursor-style two-phase execution
 */

export interface Plan {
    files_to_modify: string[];
    rationale: string;
    estimated_changes: number;
}

export interface PlanResult {
    plan: Plan;
    approved: boolean;
}

export interface ExecutionResult {
    patches: PatchProposal;
    filesModified: string[];
}

export interface ValidationResult {
    passed: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Phase 1: Planning
 * Model outputs plan without making changes
 */
export async function executePlanPhase(
    agent: any,
    userMessage: string
): Promise<Plan> {
    const planningPrompt = `
You are in PLANNING mode. Do NOT propose any code changes yet.

User request: ${userMessage}

Output a JSON plan:
{
  "files_to_modify": ["file1.py", "file2.py"],
  "rationale": "Brief explanation of approach",
  "estimated_changes": 2
}
`;

    // Execute planning agent
    const response = await agent.run(planningPrompt);
    return JSON.parse(response);
}

/**
 * Phase 2: Execution
 * Model outputs patches for planned files only
 */
export async function executeEditPhase(
    agent: any,
    plan: Plan,
    userMessage: string
): Promise<PatchProposal> {
    const editPrompt = `
You are in EXECUTION mode. Implement the following plan:

Plan: ${JSON.stringify(plan, null, 2)}
User request: ${userMessage}

CRITICAL: Only modify files listed in the plan: ${plan.files_to_modify.join(', ')}

Output JSON patches as usual.
`;

    const response = await agent.run(editPrompt);
    return JSON.parse(response);
}

/**
 * Phase 3: Validation
 * Optional linting/typechecking after patches applied
 */
export async function executeValidationPhase(
    filesModified: string[]
): Promise<ValidationResult> {
    // Placeholder for future linting integration
    // Could run: eslint, prettier, tsc, etc.

    return {
        passed: true,
        errors: [],
        warnings: []
    };
}

/**
 * Full workflow orchestration
 */
export async function executePlanValidateWorkflow(
    planAgent: any,
    editAgent: any,
    userMessage: string
): Promise<{
    plan: Plan;
    patches: PatchProposal;
    validation: ValidationResult;
}> {
    // Phase 1: Plan
    const plan = await executePlanPhase(planAgent, userMessage);

    // Phase 2: Execute
    const patches = await executeEditPhase(editAgent, plan, userMessage);

    // Verify patches only touch planned files
    const patchedFiles = patches.changes.map(c => c.path);
    const unauthorizedFiles = patchedFiles.filter(
        f => !plan.files_to_modify.includes(f)
    );

    if (unauthorizedFiles.length > 0) {
        throw new Error(
            `Agent tried to modify unauthorized files: ${unauthorizedFiles.join(', ')}`
        );
    }

    // Phase 3: Validate (after application)
    const validation = await executeValidationPhase(patchedFiles);

    return { plan, patches, validation };
}
