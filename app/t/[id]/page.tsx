
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startTest } from "@/app/actions";

import { redirect } from 'next/navigation';

export default async function TestStartPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;
    const { data: test } = await supabase.from('tests').select('*').eq('id', id).single();

    if (!test) return <div>Test not found</div>;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return redirect(`/auth/candidate?next=/t/${id}`);
    }

    const startTestWithId = startTest.bind(null, test.id);

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-[#F9F9F6]">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <div className="mb-2 text-xs font-bold uppercase text-accent tracking-wider">Engineering Assessment</div>
                    <CardTitle className="text-2xl">{test.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-sm text-secondary mb-6">
                        <p>You are about to start a scenario-based technical interview.</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>No live coding.</li>
                            <li>Focus on decisions and tradeoffs.</li>
                            <li>Answers are final once submitted.</li>
                        </ul>
                    </div>

                    <div className="bg-gray-50 p-4 mb-4 rounded border text-sm text-secondary">
                        Logged in as <span className="font-bold text-black">{user.email}</span>
                    </div>

                    <form action={startTestWithId} className="space-y-4">
                        <input type="hidden" name="email" value={user.email} />
                        <div>
                            <label className="text-sm font-medium">Confirm Full Name</label>
                            <Input name="name" required placeholder="Jane Doe" defaultValue={user.user_metadata?.full_name} className="mt-1" />
                        </div>
                        <Button type="submit" className="w-full">
                            Start Interview
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
