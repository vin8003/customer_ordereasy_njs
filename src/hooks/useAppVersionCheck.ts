'use client';

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export interface VersionConfig {
    minVersionCode: number;
    latestVersionName?: string;
    forceUpdate?: boolean;
    title?: string;
    message?: string;
    playStoreUrl?: string;
}

/**
 * Native-only update check. Compares the installed versionCode against
 * /version.json (static, FE-hosted) and returns the config when an update is required.
 */
export function useAppVersionCheck(): VersionConfig | null {
    const [updateConfig, setUpdateConfig] = useState<VersionConfig | null>(null);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let cancelled = false;
        (async () => {
            try {
                const info = await App.getInfo();
                const res = await fetch(`${window.location.origin}/version.json?t=${Date.now()}`, {
                    cache: 'no-store',
                });
                if (!res.ok) return;
                const config: VersionConfig = await res.json();
                if (!cancelled && Number(info.build) < Number(config.minVersionCode)) {
                    setUpdateConfig(config);
                }
            } catch {
                // Never block the app on a failed version check.
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return updateConfig;
}
