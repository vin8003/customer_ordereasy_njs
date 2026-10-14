'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    /** Defaults to router back via useAppNavigation. */
    onBack?: () => void;
    showBack?: boolean;
    right?: React.ReactNode;
    className?: string;
}

/** Sticky, translucent top bar shared by secondary screens. */
export default function PageHeader({
    title,
    subtitle,
    onBack,
    showBack = true,
    right,
    className,
}: PageHeaderProps) {
    const { handleBack } = useAppNavigation();

    return (
        <header className={`${styles.header} ${className || ''}`}>
            <div className={styles.inner}>
                {showBack ? (
                    <button
                        type="button"
                        className={styles.backBtn}
                        onClick={onBack || handleBack}
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} strokeWidth={2.25} />
                    </button>
                ) : (
                    <span className={styles.spacer} />
                )}
                <div className={styles.titles}>
                    <h1 className={styles.title}>{title}</h1>
                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>
                <div className={styles.right}>{right}</div>
            </div>
        </header>
    );
}
