'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResultsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-50 text-slate-500 text-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p>Redirecting to Search page...</p>
        </div>
    );
}
