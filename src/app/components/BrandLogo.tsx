import React from 'react';
import Image from 'next/image';
import styles from './BrandLogo.module.css';

interface BrandLogoProps {
    size?: 'sm' | 'md' | 'lg';
    showTagline?: boolean;
    className?: string;
}

/** Lightweight logo lockup: app mark + live-text wordmark (keeps the 4MB PNG off the critical path). */
export default function BrandLogo({ size = 'md', showTagline = false, className }: BrandLogoProps) {
    return (
        <div className={`${styles.logo} ${styles[size]} ${className || ''}`}>
            <Image src="/assets/images/logo-mark.png" alt="" aria-hidden="true" width={160} height={160} className={styles.mark} priority />
            <div className={styles.text}>
                <span className={styles.wordmark}>
                    Order <span className={styles.easy}>Easy</span>
                </span>
                {showTagline && <span className={styles.tagline}>Your City, Your Order.</span>}
            </div>
        </div>
    );
}
