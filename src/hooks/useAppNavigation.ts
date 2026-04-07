'use client';

import { App } from '@capacitor/app';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Custom hook to handle navigation consistently across Web and Native platforms.
 */
export const useAppNavigation = () => {
    const router = useRouter();
    const pathname = usePathname();

    const handleBack = useCallback(() => {
        // Define paths where the back button should exit the app or do nothing
        const rootPaths = ['/', '/home', '/login'];
        
        if (rootPaths.includes(pathname)) {
            // Check if we're running on a native platform (Capacitor)
            if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform) {
                App.exitApp();
            }
            // On Web, typically do nothing if at root
        } else {
            // Standard back navigation
            router.back();
        }
    }, [pathname, router]);

    return {
        handleBack,
        pathname,
        isRoot: ['/', '/home'].includes(pathname)
    };
};
