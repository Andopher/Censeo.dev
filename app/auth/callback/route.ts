import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    const role = searchParams.get('role'); // 'tester' or 'testee'

    console.log('[Auth Callback] Received:', { code: code?.substring(0, 10) + '...', next, role });

    if (code) {
        const supabase = await createClient();
        const { error, data } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('[Auth Callback] Exchange code error:', error);
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }

        if (data?.user) {
            console.log('[Auth Callback] User authenticated:', data.user.email);

            // Ensure Profile Exists
            if (role) {
                console.log('[Auth Callback] Creating/checking profile with role:', role);
                // Try to check if profile exists, if not create it
                const { data: profile, error: profileFetchError } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();

                if (profileFetchError) {
                    console.log('[Auth Callback] No profile found, creating new one');
                }

                if (!profile) {
                    const { error: insertError } = await supabase.from('profiles').insert({
                        id: data.user.id,
                        email: data.user.email!,
                        role: role as any,
                        full_name: data.user.user_metadata.full_name
                    });

                    if (insertError) {
                        console.error('[Auth Callback] Error creating profile:', insertError);
                    } else {
                        console.log('[Auth Callback] Profile created successfully');
                    }
                } else if (profile.role !== role) {
                    console.log('[Auth Callback] Profile exists with different role:', profile.role);
                    // Profile exists but role mismatch - for MVP, we keep existing role
                }
            }

            console.log('[Auth Callback] Redirecting to:', next);
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    console.error('[Auth Callback] No code or session data available');
    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
