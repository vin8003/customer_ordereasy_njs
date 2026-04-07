'use client';

import { App } from '@capacitor/app';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function NativeBackButton() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const backListener = App.addListener('backButton', (data: { canGoBack: boolean }) => {
            if (pathname === '/' || pathname === '/home') {
                // If we are at the root, exit the app
                App.exitApp();
            } else {
                // Otherwise, go back in history
                window.history.back();
            }
        });

        return () => {
            backListener.then((l: any) => l.remove());
        };
    }, [pathname, router]);

    return null;
}
