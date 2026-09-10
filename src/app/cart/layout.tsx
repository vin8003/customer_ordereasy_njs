'use client';

import RequireLocation from '@/app/components/RequireLocation';

export default function CartLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <RequireLocation>{children}</RequireLocation>;
}
