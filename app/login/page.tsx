'use client'

import { useState } from 'react';
import { signUp, signIn } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { GoogleAuthButton } from '@/components/auth/google-button';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const view = searchParams.get('view') || 'login'; // 'login' or 'signup'
    const [isLogin, setIsLogin] = useState(view === 'login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError('');
        setMessage('');

        // Enforce role for this page
        formData.append('role', 'tester');

        try {
            const action = isLogin ? signIn : signUp;
            const result = await action(formData);

            if (result.error) {
                setError(result.error);
                setLoading(false);
            } else if (result.confirmationRequired) {
                setLoading(false);
                setMessage('Please check your email to confirm your account.');
            } else {
                // Success
                router.push('/dashboard');
                router.refresh();
            }
        } catch (e) {
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#F9F9F6] p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Creator Studio</h1>
                    <p className="text-secondary">
                        {isLogin ? 'Sign in to manage your tests' : 'Create an account to start building'}
                    </p>
                </div>

                <div className="bg-white p-8 rounded-lg border border-border shadow-sm">
                    <div className="mb-6">
                        <GoogleAuthButton role="tester" nextUrl="/dashboard" />
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                            </div>
                        </div>
                    </div>

                    <form action={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="bg-green-50 text-green-600 p-3 rounded text-sm mb-4">
                                {message}
                            </div>
                        )}

                        {!isLogin && (
                            <div>
                                <label className="text-sm font-medium">Full Name</label>
                                <Input name="full_name" required placeholder="Alice Engineer" className="mt-1" />
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input name="email" type="email" required placeholder="alice@example.com" className="mt-1" />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Password</label>
                            <Input name="password" type="password" required minLength={6} className="mt-1" />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-accent hover:underline"
                        >
                            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
