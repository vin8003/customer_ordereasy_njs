'use client';

import RequireLocation from '@/app/components/RequireLocation';

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <RequireLocation>{children}</RequireLocation>;
}
