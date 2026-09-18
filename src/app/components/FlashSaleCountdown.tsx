'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import {
    getFlashSaleCountdownLabel,
    parseFlashSaleEndsAt,
} from '@/lib/flashSaleCountdown';
import styles from './FlashSaleCountdown.module.css';

interface FlashSaleCountdownProps {
    endsAt?: string | null;
    compact?: boolean;
}

export function FlashSaleCountdown({ endsAt, compact = false }: FlashSaleCountdownProps) {
    const [nowMs, setNowMs] = useState(() => Date.now());

    useEffect(() => {
        const endsAtMs = parseFlashSaleEndsAt(endsAt);
        if (endsAtMs == null || endsAtMs <= Date.now()) return undefined;

        const id = setInterval(() => {
            const current = Date.now();
            setNowMs(current);
            if (endsAtMs <= current) clearInterval(id);
        }, 1000);

        return () => clearInterval(id);
    }, [endsAt]);

    const label = getFlashSaleCountdownLabel(endsAt, nowMs);
    if (!label) return null;

    return (
        <div
            className={compact ? styles.compact : styles.banner}
            role="status"
            aria-live="polite"
        >
            <Clock size={compact ? 12 : 16} aria-hidden />
            <span>{label}</span>
        </div>
    );
}
