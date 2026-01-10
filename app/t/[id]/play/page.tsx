
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import QuestionRunner from "./question-runner";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PlayPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ sid?: string, mode?: string }>
}) {
    const { sid, mode } = await searchParams;
    const { id } = await params;

    if (!sid) return redirect(`/t/${id}`); // Redirect to start if no session

    const supabase = await createClient();

    // 1. Fetch Data
    const { data: submission } = await supabase.from('submissions').select('*').eq('id', sid).single();
    const { data: test } = await supabase.from('tests').select('*').eq('id', id).single();
    const { data: questions } = await supabase.from('questions').select('*').eq('test_id', id).order('order');
    const { data: responses } = await supabase.from('responses').select('*').eq('submission_id', sid);

    if (!submission || !test || !questions) return <div>Error loading assessment.</div>;

    const responseCount = responses?.length || 0;

    // Check Time Expiry
    const startedAt = new Date(submission.started_at).getTime();
    const now = Date.now();
    const timeLimitMs = test.time_limit_seconds ? test.time_limit_seconds * 1000 : 0;
    const isExpired = timeLimitMs > 0 && (now - startedAt > timeLimitMs);

    const isComplete = responseCount >= questions.length || isExpired;

    console.log('[PlayPage] Status:', {
        responseCount,
        questionsCount: questions.length,
        isComplete,
        isExpired,
        alreadyCompleted: !!submission.completed_at
    });

    // Mark complete if needed
    if (isComplete && !submission.completed_at) {
        console.log('[PlayPage] Marking submission as complete');

        // Calculate Score
        let correctCount = 0;
        let totalScorable = 0;

        questions.forEach(q => {
            // Only score binary and multi_select for now (ranking is text currently)
            if (!q.correct_answer) return;
            const r = responses?.find(res => res.question_id === q.id);
            if (!r) return;

            let isCorrect = false;

            if (q.type === 'binary_decision') {
                // Strict value match ('yes' or 'no')
                isCorrect = r.answer?.value === q.correct_answer;
            } else if (q.type === 'multi_select') {
                // Array match (sort independent)
                const correct = (q.correct_answer as string[] || []).slice().sort();
                const actual = (r.answer?.options as string[] || []).slice().sort();
                isCorrect = JSON.stringify(correct) === JSON.stringify(actual);
            }

            if (q.correct_answer) totalScorable++; // Count this question
            if (isCorrect) correctCount++;
        });

        // Calculate integer percentage (0-100)
        // If totalScorable is 0, score is null or 0? 0 is safer.
        const finalScore = totalScorable > 0 ? Math.round((correctCount / totalScorable) * 100) : 0;
        console.log(`[PlayPage] Calculated Score: ${finalScore}% (${correctCount}/${totalScorable})`);

        const { error } = await supabase
            .from('submissions')
            .update({
                completed_at: new Date().toISOString(),
                score: finalScore
            })
            .eq('id', sid);

        if (error) {
            console.error('[PlayPage] Error marking complete:', error);
        } else {
            console.log('[PlayPage] Successfully marked as complete');
        }
    }

    // Render Completed State
    // @ts-ignore
    const isReview = mode === 'review';

    if (isComplete && !isReview) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#F9F9F6] p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <CheckCircle className="w-16 h-16 text-accent mx-auto" />
                    <h1 className="text-3xl font-bold">Assessment Complete</h1>
                    <p className="text-secondary">
                        Thank you for your time. Your responses have been recorded and sent to the reviewer.
                    </p>
                    <Link href="/history" className="text-sm text-accent underline hover:text-black">View My Completion History</Link>
                </div>
            </main>
        );
    }

    if (isReview) {
        return (
            <main className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-black">{test.title}</h1>
                        <Link href="/history"><Button variant="ghost">Back</Button></Link>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-border">
                        <h3 className="font-bold border-b pb-2 mb-4 text-black">Scenario</h3>
                        <p className="whitespace-pre-wrap text-sm text-black">{test.scenario_text}</p>
                    </div>

                    {questions.map((q: any, i: number) => {
                        const ans = responses?.find(r => r.question_id === q.id)?.answer;
                        const val = ans ? (ans.value || (ans.options ? ans.options.join(', ') : JSON.stringify(ans))) : 'No answer';
                        return (
                            <div key={q.id} className="bg-white p-6 rounded-lg border border-border">
                                <div className="mb-2 text-xs font-bold uppercase text-secondary">Question {i + 1}</div>
                                <h3 className="font-medium mb-3 text-black">{q.prompt}</h3>
                                <div className="bg-gray-50 p-4 rounded text-sm text-black border border-gray-200">
                                    <div className="text-xs text-secondary mb-1">Your Answer:</div>
                                    <div className="whitespace-pre-wrap">{val}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </main>
        );
    }

    const currentQuestion = questions[responseCount];

    return (
        <main className="min-h-screen grid md:grid-cols-2">
            {/* Left Panel: Scenario */}
            <div className="bg-[#101010] text-gray-200 p-8 md:p-12 overflow-y-auto border-b md:border-b-0 md:border-r border-[#333]">
                <div className="max-w-xl mx-auto space-y-8">
                    <div>
                        <h2 className="text-xs font-bold text-accent uppercase tracking-widest mb-2">Scenario Context</h2>
                        <h1 className="text-2xl font-semibold text-white">{test.title}</h1>
                    </div>
                    <div className="prose prose-invert prose-p:leading-relaxed">
                        <p className="whitespace-pre-wrap">{test.scenario_text}</p>
                    </div>

                    {/* If we were fancy, we'd show previous answers here too as context */}
                </div>
            </div>

            {/* Right Panel: Active Question */}
            <div className="bg-[#F9F9F6] p-8 md:p-12 overflow-y-auto">
                <div className="max-w-xl mx-auto h-full">
                    <QuestionRunner
                        testId={test.id}
                        submissionId={sid}
                        question={currentQuestion}
                        totalQuestions={questions.length}
                        currentStep={responseCount}
                        // @ts-ignore
                        timeLimitSeconds={test.time_limit_seconds}
                        startedAt={submission.started_at}
                    />
                </div>
            </div>
        </main>
    );
}
