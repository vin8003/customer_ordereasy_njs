'use client';

import { useSyncExternalStore } from 'react';
import RequireLocation from '@/app/components/RequireLocation';
import { isLocalDummyCheckoutPreview } from '@/lib/checkoutLineBrandName';

function subscribeClientMount() {
    return () => {};
}

function getClientMountedSnapshot() {
    return true;
}

function getServerMountedSnapshot() {
    return false;
}

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const mounted = useSyncExternalStore(
        subscribeClientMount,
        getClientMountedSnapshot,
        getServerMountedSnapshot
    );

    if (!mounted) {
        return null;
    }

    if (isLocalDummyCheckoutPreview(window.location.hostname, window.location.search)) {
        return <>{children}</>;
    }

    return <RequireLocation>{children}</RequireLocation>;
}
