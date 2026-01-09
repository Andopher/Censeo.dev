'use client'

import { useState } from 'react';
import { TemplateDef, TEMPLATES } from '@/lib/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTest } from '@/app/actions';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

import { useRouter } from 'next/navigation';

export default function CreateTestForm({ type }: { type: string }) {
    const router = useRouter();
    const template = TEMPLATES.find(t => t.type === type);

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(template?.title || '');
    const [scenario, setScenario] = useState(template?.defaultScenario || '');
    const [timeLimit, setTimeLimit] = useState('');
    const [questions, setQuestions] = useState(
        template?.questions.map(q => {
            const constraints = q.constraints || {};
            // Set defaults for binary decision if missing
            if (q.type === 'binary_decision') {
                if (!constraints.yes_label) constraints.yes_label = 'Yes';
                if (!constraints.no_label) constraints.no_label = 'No';
            }
            return {
                ...q,
                prompt: q.defaultPrompt || '',
                constraints
            };
        }) || []
    );

    if (!template) return <div>Template not found</div>;

    const handleConstraintChange = (index: number, key: string, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index] }; // Shallow copy item
        if (!newQuestions[index].constraints) newQuestions[index].constraints = {};
        newQuestions[index].constraints = { ...newQuestions[index].constraints }; // Shallow copy constraints
        newQuestions[index].constraints[key] = value;
        setQuestions(newQuestions);
    };
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async () => {
        setShowConfirm(true);
    };

    const handleConfirmedSubmit = async () => {
        setLoading(true);
        try {
            // Proceed to create test as PUBLISHED
            const result = await createTest({
                title,
                scenario,
                type: template.type,
                questions,
                created_by: 'demo_user', // Hardcoded for MVP
                time_limit_seconds: timeLimit ? parseInt(timeLimit) * 60 : null,
                is_published: true
            });

            if (result && result.success && result.id) {
                window.location.href = '/dashboard';
            } else {
                throw new Error("Failed to create test");
            }
        } catch (e) {
            console.error(e);
            alert('Error creating test');
            setLoading(false);
            setShowConfirm(false);
        }
    };

    const handleSaveDraft = async () => {
        setLoading(true);
        try {
            // Save test as DRAFT (not published)
            const result = await createTest({
                title,
                scenario,
                type: template.type,
                questions,
                created_by: 'demo_user',
                time_limit_seconds: timeLimit ? parseInt(timeLimit) * 60 : null,
                is_published: false
            });

            if (result && result.success && result.id) {
                window.location.href = '/dashboard';
            } else {
                throw new Error("Failed to save draft");
            }
        } catch (e) {
            console.error(e);
            alert('Error saving draft');
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Test Title</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-bold mt-1"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">Scenario Introduction</label>
                    <textarea
                        className="flex w-full min-h-[120px] rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                    />
                    <p className="text-xs text-secondary mt-1">
                        Setting the stage. This is what the candidate sees first.
                    </p>
                </div>

                <div>
                    <label className="text-sm font-medium">Time Limit (Minutes)</label>
                    <Input
                        type="number"
                        min="1"
                        placeholder="No Limit"
                        className="max-w-[150px]"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                    />
                    <p className="text-xs text-secondary mt-1">
                        Optional. Leave empty for no limit.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold border-b pb-2">Questions Flow ({questions.length} Steps)</h2>

                {questions.map((q: any, i: number) => (
                    <Card key={i} className="relative group">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                Step {q.order}: {q.type}
                            </div>
                            <button
                                onClick={() => {
                                    const newQ = [...questions];
                                    newQ.splice(i, 1);
                                    // Re-order
                                    newQ.forEach((item, idx) => item.order = idx + 1);
                                    setQuestions(newQ);
                                }}
                                className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove Question"
                            >
                                &times;
                            </button>
                        </div>

                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Step {i + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs uppercase font-bold text-secondary">Prompt / Question</label>
                                <textarea
                                    className="flex w-full min-h-[80px] rounded-md border border-border bg-white px-3 py-2 text-sm mt-1"
                                    value={q.prompt}
                                    placeholder="Enter your question here..."
                                    onChange={(e) => {
                                        const newQ = [...questions];
                                        newQ[i].prompt = e.target.value;
                                        setQuestions(newQ);
                                    }}
                                />
                            </div>

                            {/* Dynamic Constraint Editing based on Type */}
                            {(q.type === 'forced_ranking' || q.type === 'multi_select') && (
                                <div>
                                    <label className="text-xs uppercase font-bold text-secondary">
                                        {q.type === 'multi_select' ? 'Options (One per line)' : 'Items to Rank (One per line)'}
                                    </label>
                                    <textarea
                                        className="flex w-full min-h-[100px] rounded-md border border-border bg-white px-3 py-2 text-sm mt-1 font-mono"
                                        value={q.constraints?.options?.join('\n') || ''}
                                        placeholder="Option A&#10;Option B&#10;Option C"
                                        onChange={(e) => {
                                            const options = e.target.value.split('\n');
                                            handleConstraintChange(i, 'options', options);
                                        }}
                                    />
                                </div>
                            )}

                            {q.type === 'binary_decision' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs uppercase font-bold text-secondary">Yes Label</label>
                                        <Input
                                            value={q.constraints?.yes_label || ''}
                                            placeholder="Yes / Approve"
                                            onChange={(e) => handleConstraintChange(i, 'yes_label', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-secondary">No Label</label>
                                        <Input
                                            value={q.constraints?.no_label || ''}
                                            placeholder="No / Reject"
                                            onChange={(e) => handleConstraintChange(i, 'no_label', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                ))}

                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center gap-4 hover:border-accent/40 transition-colors">
                    <p className="text-sm font-medium text-secondary">Add Next Step</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Button variant="outline" size="sm" onClick={() => {
                            setQuestions([...questions, { order: questions.length + 1, type: 'short_text', prompt: '', defaultPrompt: '', constraints: {} }]);
                        }}>
                            + Short Text
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                            setQuestions([...questions, { order: questions.length + 1, type: 'binary_decision', prompt: '', defaultPrompt: '', constraints: { yes_label: 'Yes', no_label: 'No' } }]);
                        }}>
                            + Binary Decision
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                            setQuestions([...questions, { order: questions.length + 1, type: 'multi_select', prompt: '', defaultPrompt: '', constraints: { options: [], max_select: 2 } }]);
                        }}>
                            + Multi Select
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                            setQuestions([...questions, { order: questions.length + 1, type: 'forced_ranking', prompt: '', defaultPrompt: '', constraints: { options: [] } }]);
                        }}>
                            + Forced Ranking
                        </Button>
                    </div>
                </div>
            </div>


            <div className="mt-8 pb-8 flex justify-center gap-4">
                <Button
                    onClick={handleSaveDraft}
                    disabled={loading}
                    size="lg"
                    variant="outline"
                >
                    {loading ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button onClick={handleSubmit} disabled={loading} size="lg">
                    {loading ? 'Publishing...' : 'Publish Test'}
                </Button>
            </div>

            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => {
                    setShowConfirm(false);
                    setLoading(false);
                }}
                onConfirm={handleConfirmedSubmit}
                title="Publish Test?"
                message="Are you sure you want to publish this test? This action cannot be undone."
                loading={loading}
            />
        </div>
    );
}
