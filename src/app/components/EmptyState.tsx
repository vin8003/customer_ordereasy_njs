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
                'flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-6 py-12 text-center',
                className
            )}
        >
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-lg shadow-primary/10">
                <Icon className="size-7" />
            </div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
            {description ? (
                <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
            ) : null}
            {actionLabel && onAction ? (
                <Button onClick={onAction} className="mt-2">
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    );
}
