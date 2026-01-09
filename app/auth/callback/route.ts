import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    const role = searchParams.get('role'); // 'tester' or 'testee'

    if (code) {
        const supabase = await createClient();
        const { error, data } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data?.user) {
            // Ensure Profile Exists
            if (role) {
                // Try to check if profile exists, if not create it
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();

                if (!profile) {
                    await supabase.from('profiles').insert({
                        id: data.user.id,
                        email: data.user.email!,
                        role: role as any,
                        full_name: data.user.user_metadata.full_name
                    });
                } else if (profile.role !== role) {
                    // Profile exists but role mismatch?
                    // For MVP, if they are tester logging in as testee (or vice versa), what do we do?
                    // Maybe we don't force update, but just log it?
                    // Or maybe we update it?
                    // Let's assume role is fixed on creation for now.
                }
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
