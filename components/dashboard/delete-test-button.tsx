'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteTest } from '@/app/actions';
import { useRouter } from 'next/navigation';

export function DeleteTestButton({ testId, testTitle }: { testId: string, testTitle: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') return;
        setLoading(true);
        try {
            await deleteTest(testId);
            // Use window.location.href for reliable navigation
            window.location.href = '/dashboard';
        } catch (error) {
            console.error(error);
            alert('Failed to delete test');
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button variant="destructive" size="sm" onClick={() => setIsOpen(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg space-y-4">
                <h2 className="text-xl font-bold text-red-600">Delete Test?</h2>
                <div className="text-sm text-secondary">
                    This will permanently delete <span className="font-bold text-black">{testTitle}</span> and all its submissions.
                    This action cannot be undone.
                </div>
                <div>
                    <label className="text-xs uppercase font-bold text-secondary">Type "DELETE" to confirm</label>
                    <input
                        className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm mt-1"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={confirmText !== 'DELETE' || loading}
                    >
                        {loading ? 'Deleting...' : 'Delete Test'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
