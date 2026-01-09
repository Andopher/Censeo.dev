'use client'

import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    loading?: boolean;
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading = false }: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg space-y-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-sm text-secondary">{message}</p>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={loading}>
                        {loading ? 'Publishing...' : 'Confirm'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
