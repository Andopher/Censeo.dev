
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProfileButton } from "@/components/profile-button";

import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // Check user role - only testers can access dashboard
    const { data: roleCheck } = await supabase
        .from('profiles')
        .select('role, profile_picture_url')
        .eq('id', user.id)
        .single();

    if (roleCheck?.role !== 'tester') {
        return redirect('/history'); // Redirect non-testers to history
    }

    // Filter tests by logged in creator - separate published and drafts
    const { data: publishedTests } = await supabase
        .from('tests')
        .select('*')
        .eq('created_by', user.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    const { data: draftTests } = await supabase
        .from('tests')
        .select('*')
        .eq('created_by', user.id)
        .eq('is_published', false)
        .order('created_at', { ascending: false });

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
                        <p className="text-secondary mt-1">Manage your active tests and view results.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/new">
                            <Button>
                                <Plus className="mr-2 w-4 h-4" />
                                New Test
                            </Button>
                        </Link>
                        <ProfileButton userEmail={user.email || undefined} profilePictureUrl={roleCheck?.profile_picture_url || undefined} />
                    </div>
                </div>

                {/* In Progress / Drafts Section */}
                {draftTests && draftTests.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            In Progress ({draftTests.length})
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {draftTests.map((test) => (
                                <Link key={test.id} href={`/dashboard/${test.id}`}>
                                    <Card className="hover:border-accent transition-colors cursor-pointer h-full border-yellow-200 bg-yellow-50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                {test.title}
                                                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Draft</span>
                                            </CardTitle>
                                            <CardDescription>
                                                {test.template_type.replace('_', ' ')}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-secondary text-sm line-clamp-3">
                                                {test.scenario_text}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active / Published Tests Section */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Active Tests ({publishedTests?.length || 0})
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {publishedTests?.map((test) => (
                            <Link key={test.id} href={`/dashboard/${test.id}`}>
                                <Card className="hover:border-accent transition-colors cursor-pointer h-full">
                                    <CardHeader>
                                        <CardTitle>{test.title}</CardTitle>
                                        <CardDescription>
                                            {test.template_type.replace('_', ' ')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-secondary text-sm line-clamp-3">
                                            {test.scenario_text}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                        {(!publishedTests || publishedTests.length === 0) && (!draftTests || draftTests.length === 0) && (
                            <p className="text-secondary col-span-full text-center py-10">
                                No tests found. Create your first one.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
