'use client';

import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationWrapper({ children }: { children: React.ReactNode }) {
    useNotifications();
    return <>{children}</>;
}
