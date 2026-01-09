
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

        if (q.type === 'forced_ranking') return <pre className="font-mono text-sm bg-gray-50 p-2 rounded">{val.value}</pre>;
        if (q.type === 'multi_select') return <ul className="list-disc pl-4">{val.options?.map((o: string) => <li key={o}>{o}</li>)}</ul>;
        if (q.type === 'binary_decision') return <span className={`font-bold ${val.value === 'yes' ? 'text-green-600' : 'text-red-600'}`}>{val.value === 'yes' ? q.constraints?.yes_label || 'Yes' : q.constraints?.no_label || 'No'}</span>;
        return <p className="whitespace-pre-wrap">{val.value}</p>;
    };

    async function postNote(formData: FormData) {
        'use server'
        // Need to re-fetch user because server action is a new request context? 
        // Yes, but we can trust `user` from outer scope? NO, server actions need own auth check often.
        // But here we are inside the component closure? No, `async function postNote` is a separate export if top level, but here it is inline?
        // Inline server actions in components: They capture closure variables but NOT async data securely?
        // Wait, standard practice: Re-verify auth inside action.
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
                    <div>
                        <h2 className="text-secondary text-sm uppercase font-bold">Candidate Submission</h2>
                        <h1 className="text-3xl font-bold">{submission.candidate_name}</h1>
                        <p className="text-secondary">{submission.candidate_email}</p>
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
                                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                        {formatAnswer(q, resp)}
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
