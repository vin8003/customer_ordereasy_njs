'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/app/components/LoadingScreen';
import { hasConfirmedLocation, requestAndPersistLocation } from '@/utils/location';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            // Returning users who already confirmed GPS or a manual city can shop.
            if (hasConfirmedLocation()) {
                router.replace('/retailers');
                return;
            }

            const loc = await requestAndPersistLocation();
            if (cancelled) return;

            if (loc) {
                router.replace('/retailers');
                return;
            }

            // GPS denied/failed: ask the user to pick a city. Do not silently pin Bharatpur.
            router.replace('/city-selection');
        };

        bootstrap();
        return () => {
            cancelled = true;
        };
    }, [router]);

    return <LoadingScreen message="Finding your location..." fullScreen />;
}
