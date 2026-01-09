'use client'

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function RefreshButton() {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.refresh();
        // Reset animation after a delay
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
        >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
    );
}
