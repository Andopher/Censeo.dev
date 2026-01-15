'use client'

import { useState, useEffect, Suspense } from 'react';
import { signUp, signIn } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { GoogleAuthButton } from '@/components/auth/google-button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

function LoginForm() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError('');
        setMessage('');

        const loginEmail = formData.get('email') as string;
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', loginEmail);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        // Enforce role for this page
        formData.append('role', 'tester');

        try {
            const action = isLogin ? signIn : signUp;
            const result = await action(formData);

            if (result.error) {
                setError(result.error);
                setLoading(false);
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
        <div className="max-w-md w-full space-y-8">
            <div className="text-center">
                <div className="text-xs font-bold uppercase text-accent tracking-wider mb-2">Test Creator Portal</div>
                <h1 className="text-2xl font-bold mb-2">
                    {isLogin ? 'Welcome Back' : 'Create Your Account'}
                </h1>
                <p className="text-secondary text-sm">
                    {isLogin ? 'Sign in to manage your tests' : 'Get started with creating judgment tests'}
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
                            <Input name="full_name" required placeholder="John Doe" className="mt-1" />
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            name="email"
                            type="email"
                            required
                            placeholder="john@example.com"
                            className="mt-1"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Password</label>
                        <Input name="password" type="password" required minLength={6} className="mt-1" />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                            />
                            <span className="text-sm text-gray-600">Remember me</span>
                        </label>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-gray-500 hover:text-black hover:underline"
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[#F9F9F6] p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <LoginForm />
            </Suspense>
        </main>
    );
}
