
import CreateTestForm from './form';
import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function CreateTestPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { type } = await searchParams;

    if (!type || Array.isArray(type)) {
        return <div>Missing Type</div>;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login?next=/new/create');

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-3xl mx-auto p-8">
                <div className="mb-6 flex items-start gap-4">
                    <Link href="/new">
                        <Button variant="ghost" size="sm" className="mt-1">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <p className="text-xs font-bold text-accent uppercase mb-1">Creator Studio</p>
                        <h1 className="text-2xl font-bold">Customize Template</h1>
                    </div>
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                    <CreateTestForm type={type} />
                </Suspense>
            </div>
        </main>
    );
}
