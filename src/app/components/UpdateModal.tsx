'use client';

import { useEffect, useState } from 'react';
import { useAppVersionCheck } from '@/hooks/useAppVersionCheck';
import { Button } from '@/components/ui/button';

const PLAY_STORE_WEB_URL = 'https://play.google.com/store/apps/details?id=win.ordereasy.customer';
const PLAY_STORE_MARKET_URL = 'market://details?id=win.ordereasy.customer';

export default function UpdateModal() {
    const config = useAppVersionCheck();
    const [dismissed, setDismissed] = useState(false);

    const force = !!config && config.forceUpdate === true && !dismissed;

    // Lets the native back-button handler know it must not navigate behind a forced modal.
    useEffect(() => {
        if (!force) return;
        document.body.dataset.updateRequired = 'true';
        return () => {
            delete document.body.dataset.updateRequired;
        };
    }, [force]);

    if (!config || dismissed) return null;

    const openStore = () => {
        const market = config.playStoreUrl || PLAY_STORE_MARKET_URL;
        // market:// fails silently without the Play Store app; if the page is still
        // visible shortly after, fall back to the web URL.
        window.setTimeout(() => {
            if (!document.hidden) window.location.href = PLAY_STORE_WEB_URL;
        }, 800);
        window.location.href = market;
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-modal-title"
            onClick={force ? undefined : () => setDismissed(true)}
        >
            <div
                className="relative w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {!force && (
                    <button
                        type="button"
                        aria-label="Close"
                        className="absolute right-3 top-3 h-8 w-8 rounded-full text-xl leading-none text-muted-foreground"
                        onClick={() => setDismissed(true)}
                    >
                        ×
                    </button>
                )}
                <h2 id="update-modal-title" className="text-lg font-bold">
                    {config.title || 'Update Available'}
                </h2>
                {config.latestVersionName && (
                    <p className="mt-1 text-xs text-muted-foreground">Version {config.latestVersionName}</p>
                )}
                <p className="mt-3 text-sm text-muted-foreground">
                    {config.message || 'A new version of Order Easy is available. Please update to continue.'}
                </p>
                <Button className="mt-5 w-full" onClick={openStore}>
                    Update on Play Store
                </Button>
            </div>
        </div>
    );
}
