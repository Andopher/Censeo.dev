
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileButton } from "@/components/profile-button";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/auth/candidate?next=/history');
    }

    const email = user.email; // Always use logged in user's email/ID

    // Fetch submissions for this candidate
    const { data } = await supabase
        .from('submissions')
        .select('*, tests(title, template_type, scenario_text)')
        .eq('candidate_id', user.id) // Secure filter
        .order('completed_at', { ascending: false });

    // Get profile picture
    const { data: profile } = await supabase
        .from('profiles')
        .select('profile_picture_url')
        .eq('id', user.id)
        .single();

    let submissions = data || [];

    async function search(formData: FormData) {
        'use server'
        const email = formData.get('email');
        redirect(`/history?email=${email}`);
    }

    return (
        <main className="min-h-screen bg-[#F9F9F6] p-8 flex flex-col items-center">
            <div className="max-w-3xl w-full space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Candidate History</h1>
                    <ProfileButton userEmail={user.email || undefined} profilePictureUrl={profile?.profile_picture_url || undefined} />
                </div>

                {/* removed search form, auto-show for logged in user */}

                <div className="flex justify-between items-center mb-4">
                    <p className="text-secondary">History for <span className="font-bold text-black">{email}</span></p>
                </div>

                {email && (
                    <div className="space-y-4">
                        {submissions.length === 0 ? (
                            <p className="text-center text-secondary">No history found for {email}.</p>
                        ) : (
                            submissions.map(sub => (
                                <Card key={sub.id} className="hover:border-accent transition-colors">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <div>
                                            <CardTitle>{sub.tests?.title}</CardTitle>
                                            <p className="text-xs text-secondary mt-1">{sub.tests?.template_type}</p>
                                        </div>
                                        <div className="text-right">
                                            {sub.completed_at ? (
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Completed</span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">In Progress</span>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex justify-between items-end">
                                        <p className="text-sm text-secondary line-clamp-2 max-w-lg">
                                            {sub.tests?.scenario_text}
                                        </p>
                                        <Link href={`/t/${sub.test_id}/play?sid=${sub.id}&mode=review`}>
                                            <Button variant="outline" size="sm">
                                                {sub.completed_at ? 'View Answers' : 'Resume'}
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
