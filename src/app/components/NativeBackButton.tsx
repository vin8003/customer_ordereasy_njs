'use client';

import { App } from '@capacitor/app';
import { useEffect } from 'react';
import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function NativeBackButton() {
    const { handleBack } = useAppNavigation();

    useEffect(() => {
        const backListener = App.addListener('backButton', (data: { canGoBack: boolean }) => {
            handleBack();
        });

        return () => {
            backListener.then((l: any) => l.remove());
        };
    }, [handleBack]);

    return null;
}
