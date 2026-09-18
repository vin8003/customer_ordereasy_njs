'use client';

import { useSyncExternalStore } from 'react';
import RequireLocation from '@/app/components/RequireLocation';
import { isLocalDummyCheckoutPreview } from '@/lib/checkoutLineBrandName';

function subscribeDummyPreview() {
    return () => {};
}

function getDummyPreviewSnapshot() {
    return isLocalDummyCheckoutPreview(window.location.hostname, window.location.search);
}

function getDummyPreviewServerSnapshot() {
    return false;
}

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const allowLocalDummy = useSyncExternalStore(
        subscribeDummyPreview,
        getDummyPreviewSnapshot,
        getDummyPreviewServerSnapshot
    );

    if (allowLocalDummy) {
        return <>{children}</>;
    }

    return <RequireLocation>{children}</RequireLocation>;
}
