'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/app/components/LoadingScreen';
import { hasConfirmedLocation } from '@/utils/location';

/** Blocks shopping routes until the customer has a confirmed city (KAN-71). */
export default function RequireLocation({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (hasConfirmedLocation()) {
            setReady(true);
            return;
        }
        router.replace('/');
    }, [router]);

    if (!ready) {
        return <LoadingScreen message="Checking location..." fullScreen />;
    }

    return <>{children}</>;
}
