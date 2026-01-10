
import { createClient } from "@/utils/supabase/server";
import { addNote } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function SubmissionReviewPage({ params }: { params: Promise<{ sid: string }> }) {
    const supabase = await createClient();
    const { sid } = await params;

    // Eth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    // Fetch Data
    const { data: submission } = await supabase.from('submissions').select('*').eq('id', sid).single();

    if (!submission) return <div>Submission not found</div>;

    const { data: test } = await supabase.from('tests').select('*').eq('id', submission.test_id).single();
    if (test.created_by !== user.id) return <div>Unauthorized</div>;
    const { data: questions } = await supabase.from('questions').select('*').eq('test_id', submission.test_id).order('order');
    const { data: responses } = await supabase.from('responses').select('*').eq('submission_id', sid);
    const { data: notes } = await supabase.from('reviewer_notes').select('*').eq('submission_id', sid).order('created_at', { ascending: false });

    // Helper to find answer
    const getAnswer = (qId: string) => responses?.find(r => r.question_id === qId);

    // Formatting Answer
    const formatAnswer = (q: any, ans: any) => {
        if (!ans) return <span className="text-red-500 italic">No answer</span>;
        const val = ans.answer;

        if (q.type === 'forced_ranking') return <pre className="font-mono text-sm bg-gray-50 p-2 rounded whitespace-pre-wrap break-words">{val.value}</pre>;
        if (q.type === 'multi_select') return <ul className="list-disc pl-4">{val.options?.map((o: string) => <li key={o}>{o}</li>)}</ul>;
        if (q.type === 'binary_decision') return <span className={`font-bold ${val.value === 'yes' ? 'text-green-600' : 'text-red-600'}`}>{val.value === 'yes' ? q.constraints?.yes_label || 'Yes' : q.constraints?.no_label || 'No'}</span>;
        return <p className="whitespace-pre-wrap break-words">{val.value}</p>;
    };
    async function postNote(formData: FormData) {
        'use server'
        // Inline server actions in components capture closure variables (sid)
        const sb = await createClient(); // fresh client
        const { data: { user: actor } } = await sb.auth.getUser();
        if (!actor) throw new Error('Unauthorized');

        const text = formData.get('note') as string;
        await addNote(sid, text, actor.email || 'unknown');
        revalidatePath(`/dashboard/submission/${sid}`);
    }

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content: Questions & Answers */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-secondary text-sm uppercase font-bold">Candidate Submission</h2>
                            <h1 className="text-3xl font-bold">{submission.candidate_name}</h1>
                            <p className="text-secondary">{submission.candidate_email}</p>
                        </div>
                        {submission.score !== null && (
                            <div className="text-right bg-white p-4 rounded-lg border border-border shadow-sm">
                                <div className="text-4xl font-bold text-accent">{submission.score}%</div>
                                <div className="text-xs text-secondary uppercase tracking-widest font-bold">Score</div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-border">
                        <h3 className="font-bold border-b pb-2 mb-4">Scenario</h3>
                        <p className="text-sm whitespace-pre-wrap">{test?.scenario_text}</p>
                    </div>

                    <div className="space-y-6">
                        {questions?.map((q, i) => {
                            const resp = getAnswer(q.id);
                            return (
                                <div key={q.id} className="bg-white p-6 rounded-lg border border-border">
                                    <div className="flex justify-between mb-4">
                                        <span className="text-xs font-bold uppercase text-accent">Step {i + 1}</span>
                                        <span className="text-xs font-mono text-secondary">{resp?.time_spent_seconds || 0}s</span>
                                    </div>
                                    <h3 className="font-medium mb-4">{q.prompt}</h3>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-100 flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            {formatAnswer(q, resp)}
                                        </div>
                                        {/* Scoring Badge */}
                                        {q.correct_answer && (() => {
                                            const r = resp;
                                            let isCorrect = false;
                                            if (q.type === 'binary_decision') isCorrect = r?.answer?.value === q.correct_answer;
                                            if (q.type === 'multi_select') {
                                                const c = (q.correct_answer as string[] || []).slice().sort();
                                                const a = (r?.answer?.options as string[] || []).slice().sort();
                                                isCorrect = JSON.stringify(c) === JSON.stringify(a);
                                            }

                                            return (
                                                <div className="flex flex-col items-end gap-2 min-w-[200px]">
                                                    {isCorrect ? (
                                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">
                                                            ✅ Correct
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">
                                                                ❌ Incorrect
                                                            </span>
                                                            <div className="text-xs text-right text-secondary whitespace-pre-wrap">
                                                                <span className="font-bold">Correct:</span><br />
                                                                {q.type === 'forced_ranking' && q.correct_answer?.value
                                                                    ? q.correct_answer.value.map((v: string, idx: number) => `${idx + 1}. ${v}`).join('\n')
                                                                    : (Array.isArray(q.correct_answer)
                                                                        ? q.correct_answer.join(', ')
                                                                        : (q.type === 'binary_decision'
                                                                            ? (q.correct_answer === 'yes' ? q.constraints?.yes_label : q.constraints?.no_label)
                                                                            : q.correct_answer
                                                                        )
                                                                    )
                                                                }
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar: Notes */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-border sticky top-8">
                        <h3 className="font-bold mb-4">Reviewer Notes</h3>

                        <form action={postNote} className="mb-6">
                            <textarea
                                name="note"
                                required
                                placeholder="Leave a private note..."
                                className="w-full text-sm p-3 border rounded mb-2 min-h-[100px]"
                            />
                            <Button size="sm" type="submit" className="w-full">Add Note</Button>
                        </form>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {notes?.map(note => (
                                <div key={note.id} className="text-sm border-b pb-2 last:border-0 relative">
                                    <p className="whitespace-pre-wrap mb-1">{note.note_text}</p>
                                    <span className="text-xs text-secondary block">{new Date(note.created_at).toLocaleString()}</span>
                                </div>
                            ))}
                            {(!notes || notes.length === 0) && (
                                <p className="text-xs text-secondary italic">No notes yet.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
