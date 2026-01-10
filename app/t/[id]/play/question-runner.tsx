'use client'

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { submitResponse } from "@/app/actions";
import { useRouter } from "next/navigation";
import { Clock } from 'lucide-react';

export default function QuestionRunner({
    testId,
    submissionId,
    question,
    totalQuestions,
    currentStep,
    timeLimitSeconds,
    startedAt
}: {
    testId: string,
    submissionId: string,
    question: any,
    totalQuestions: number,
    currentStep: number,
    timeLimitSeconds?: number,
    startedAt: string
}) {
    const router = useRouter();
    const [answer, setAnswer] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const startTime = useRef(Date.now());
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]); // For multi-select

    // Timer State
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Initial Timer Setup
    useEffect(() => {
        if (timeLimitSeconds) {
            const start = new Date(startedAt).getTime();
            const end = start + (timeLimitSeconds * 1000);

            const tick = () => {
                const now = Date.now();
                const remaining = Math.max(0, Math.ceil((end - now) / 1000));
                setTimeLeft(remaining);

                if (remaining <= 0) {
                    // Time is up! Reload to let server handle completion status
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000); // 2 second delay to show the "Time Expired" message
                }
            };

            tick(); // Immediate
            const interval = setInterval(tick, 1000);
            return () => clearInterval(interval);
        }
    }, [timeLimitSeconds, startedAt]);


    // Reset state when question changes
    useEffect(() => {
        setAnswer(null);
        setSelectedOptions([]);
        startTime.current = Date.now();
    }, [question.id]);

    const handleSubmit = async () => {
        // Allow empty submit if time is up? No, stick to logic.
        if (!answer && selectedOptions.length === 0 && (timeLeft === null || timeLeft > 0)) return;

        setSubmitting(true);
        const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

        const finalAnswer = (question.type === 'multi_select') ? { options: selectedOptions } : { value: answer };

        try {
            await submitResponse(submissionId, question.id, finalAnswer, timeSpent);
            // Force page reload to show next question
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert('Failed to submit response. Please try again.');
            setSubmitting(false);
        }
    };

    // Format time helper
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const isTimeUp = timeLeft !== null && timeLeft <= 0;

    // Render Inputs based on type (Logic remains mostly same)
    const renderInput = () => {
        if (isTimeUp) {
            return (
                <div className="p-8 bg-red-50 border border-red-200 rounded-lg text-center">
                    <h3 className="text-red-700 font-bold text-lg mb-2">Time Expired</h3>
                    <p className="text-secondary">The time limit for this assessment has been reached.</p>
                </div>
            );
        }

        const { type, constraints } = question;

        if (type === 'forced_ranking') {
            return (
                <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 text-yellow-800 text-sm mb-4 border border-yellow-200 rounded">
                        Ranking: Please type your ranked list below (Top = Highest Priority).
                    </div>

                    {constraints?.options?.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded border border-gray-100 mb-4">
                            <div className="text-xs font-bold text-secondary mb-2 uppercase">Items to Rank:</div>
                            <ul className="list-disc pl-4 space-y-1 text-sm">
                                {constraints.options.map((opt: string) => <li key={opt}>{opt}</li>)}
                            </ul>
                        </div>
                    )}
                    <textarea
                        className="w-full min-h-[150px] p-3 border rounded text-sm"
                        placeholder={`1. Option A\n2. Option B...`}
                        value={answer || ''}
                        onChange={(e) => setAnswer(e.target.value)}
                    />
                </div>
            );
        }

        if (type === 'multi_select') {
            const options = constraints?.options || [];
            return (
                <div className="space-y-2">
                    {options.map((opt: string) => (
                        <label key={opt} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedOptions.includes(opt)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        if (constraints.max_select && selectedOptions.length >= constraints.max_select) return;
                                        setSelectedOptions([...selectedOptions, opt]);
                                    } else {
                                        setSelectedOptions(selectedOptions.filter(x => x !== opt));
                                    }
                                }}
                                className="h-4 w-4 text-accent"
                            />
                            <span>{opt}</span>
                        </label>
                    ))}
                    {constraints.max_select && (
                        <p className="text-xs text-secondary">Select up to {constraints.max_select} options.</p>
                    )}
                </div>
            );
        }

        if (type === 'binary_decision') {
            return (
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setAnswer('yes')}
                        className={`p-6 border rounded-lg text-center transition-all ${answer === 'yes' ? 'bg-accent text-white border-accent' : 'hover:border-accent'}`}
                    >
                        {constraints?.yes_label || 'Yes'}
                    </button>
                    <button
                        onClick={() => setAnswer('no')}
                        className={`p-6 border rounded-lg text-center transition-all ${answer === 'no' ? 'bg-accent text-white border-accent' : 'hover:border-accent'}`}
                    >
                        {constraints?.no_label || 'No'}
                    </button>
                </div>
            );
        }

        // Default: Short Text
        return (
            <textarea
                className="w-full min-h-[150px] p-3 border rounded-md text-sm focus:ring-2 focus:ring-accent outline-none"
                placeholder="Type your answer..."
                value={answer || ''}
                onChange={(e) => setAnswer(e.target.value)}
            />
        );
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Timer Banner */}
            {timeLeft !== null && (
                <div className={`absolute -top-4 right-0 flex items-center bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm ${timeLeft < 60 ? 'text-red-500 border-red-200 animate-pulse' : 'text-secondary'}`}>
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="font-mono font-bold text-sm tracking-widest">{formatTime(timeLeft)}</span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto mb-6 pt-4">
                <div className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">
                    Question {currentStep + 1} of {totalQuestions}
                </div>
                <h2 className="text-lg font-medium text-foreground mb-6 whitespace-pre-wrap">
                    {question.prompt}
                </h2>

                {renderInput()}
            </div>

            <div className="pt-4 border-t mt-auto">
                <Button
                    onClick={handleSubmit}
                    disabled={submitting || (!answer && selectedOptions.length === 0)}
                    className="w-full text-lg h-12"
                    variant={isTimeUp ? "secondary" : "primary"}
                >
                    {submitting ? 'Saving...' : (isTimeUp ? 'Time Expired' : 'Submit Decision')}
                </Button>
            </div>
        </div>
    );
}
