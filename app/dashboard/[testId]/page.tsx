import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { DeleteTestButton } from "@/components/dashboard/delete-test-button";
import { RefreshButton } from "@/components/dashboard/refresh-button";

function timeAgo(dateStr: string) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default async function TestDetailPage({ params }: { params: Promise<{ testId: string }> }) {
    const supabase = await createClient();
    const { testId } = await params;
    const { data: test } = await supabase.from('tests').select('*').eq('id', testId).single();

    // Fetch submissions with responses count?
    // We want to see if completed.
    const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('test_id', testId)
        .order('started_at', { ascending: false });

    if (!test) return <div>Test not found</div>;

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <Link href="/dashboard" className="text-sm text-secondary hover:underline">← Back to Dashboard</Link>
                    <div className="flex justify-between items-center mt-2">
                        <h1 className="text-3xl font-bold">{test.title} / Submissions</h1>
                        <div className="flex gap-2">
                            <RefreshButton />
                            <CopyLinkButton testId={test.id} />
                            <DeleteTestButton testId={test.id} testTitle={test.title} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 border-b border-border text-secondary font-medium">
                            <tr>
                                <th className="p-4">Candidate</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Started</th>
                                <th className="p-4">Time Spent</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions?.map((sub) => {
                                const isComplete = !!sub.completed_at;
                                const duration = isComplete
                                    ? Math.round((new Date(sub.completed_at).getTime() - new Date(sub.started_at).getTime()) / 60000) + 'm'
                                    : '-';

                                return (
                                    <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                                        <td className="p-4 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">
                                                    {sub.candidate_name?.substring(0, 2).toUpperCase() || sub.candidate_email?.substring(0, 2).toUpperCase() || '??'}
                                                </div>
                                                <div>
                                                    <div>{sub.candidate_name}</div>
                                                    <div className="text-xs text-secondary">{sub.candidate_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {isComplete ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Completed</span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">In Progress</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-secondary">{timeAgo(sub.started_at)}</td>
                                        <td className="p-4 text-secondary">{duration}</td>
                                        <td className="p-4 text-right">
                                            <Link href={`/dashboard/submission/${sub.id}`}>
                                                <span className="font-bold text-accent hover:underline">Review</span>
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                            {(!submissions || submissions.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-secondary">No submissions yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
