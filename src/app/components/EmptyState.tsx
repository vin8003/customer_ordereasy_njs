'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex min-h-[260px] w-full max-w-md flex-col items-center justify-center gap-2 px-6 py-12 text-center mx-auto',
                className
            )}
        >
            <div className="relative mb-3 flex size-20 items-center justify-center">
                <div className="absolute inset-0 rounded-[28px] bg-[var(--brand-50)] rotate-6" />
                <div className="absolute inset-0 rounded-[28px] border border-[var(--brand-100)] bg-white shadow-[var(--sh-md)]" />
                <Icon className="relative size-9 text-[var(--brand-600)]" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-[var(--ink)]">{title}</h3>
            {description ? (
                <p className="max-w-xs text-sm leading-relaxed text-[var(--ink-3)]">{description}</p>
            ) : null}
            {actionLabel && onAction ? (
                <Button onClick={onAction} size="lg" className="mt-4 min-w-[180px]">
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    );
}
