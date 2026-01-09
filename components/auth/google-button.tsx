'use client'

import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc'; // Assuming react-icons is installed or I need to use SVG
import { useState } from 'react';

export function GoogleAuthButton({ nextUrl = '/dashboard', role = 'testee' }: { nextUrl?: string, role?: 'tester' | 'testee' }) {
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${nextUrl}&role=${role}`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) {
            console.error('Google Login Error:', error);
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            type="button"
            className="w-full relative"
            onClick={handleLogin}
            disabled={loading}
        >
            <FcGoogle className="w-5 h-5 absolute left-4" />
            {loading ? 'Connecting...' : 'Continue with Google'}
        </Button>
    );
}
