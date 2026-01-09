
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { LogOut, Trash2 } from "lucide-react";
import { ProfilePictureUpload } from "@/components/profile-picture-upload";
import Image from "next/image";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // Get profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('profile_picture_url')
        .eq('id', user.id)
        .single();

    async function handleSignOut() {
        'use server'
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect('/');
    }

    async function handleDeleteAccount() {
        'use server'
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Delete user's data
        await supabase.from('tests').delete().eq('created_by', user.id);
        await supabase.from('submissions').delete().eq('candidate_id', user.id);

        // Sign out and redirect
        await supabase.auth.signOut();
        redirect('/');
    }

    const initials = user.email?.substring(0, 2).toUpperCase() || 'U';

    return (
        <main className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center pb-4 border-b">
                        {profile?.profile_picture_url ? (
                            <Image
                                src={profile.profile_picture_url}
                                alt="Profile"
                                width={100}
                                height={100}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center">
                                <span className="text-white font-bold text-2xl">{initials}</span>
                            </div>
                        )}
                        <p className="text-sm text-secondary mt-3">Signed in as</p>
                        <p className="font-medium">{user.email}</p>
                    </div>

                    <ProfilePictureUpload />

                    <form action={handleSignOut}>
                        <Button
                            type="submit"
                            variant="outline"
                            className="w-full justify-start"
                        >
                            <LogOut className="mr-2 w-4 h-4" />
                            Sign Out
                        </Button>
                    </form>

                    <form action={handleDeleteAccount}>
                        <Button
                            type="submit"
                            variant="destructive"
                            className="w-full justify-start"
                        >
                            <Trash2 className="mr-2 w-4 h-4" />
                            Delete Account
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
