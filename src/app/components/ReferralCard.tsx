'use client';

import React from 'react';
import { Copy, Gift, Share2 } from 'lucide-react';
import styles from './ReferralCard.module.css';

interface ReferralCardProps {
    referralCode: string;
    totalReferrals: number;
    successfulReferrals: number;
    onCopy: () => void;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({
    referralCode,
    totalReferrals,
    successfulReferrals,
    onCopy
}) => {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <div className={styles.title}>
                        Refer & Earn
                    </div>
                    <div className={styles.subtitle}>Invite friends & earn rewards</div>
                </div>
                <div className={styles.iconWrapper}>
                    <Gift size={24} color="white" />
                </div>
            </div>

            <div className={styles.codeContainer}>
                <div className={styles.codeLabel}>Your Referral Code</div>
                <div className={styles.codeValue}>{referralCode || '---'}</div>
                <button className={styles.copyButton} onClick={onCopy}>
                    <Copy size={14} />
                    Copy Code
                </button>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                    <div className={styles.statValue}>{totalReferrals}</div>
                    <div className={styles.statLabel}>Friends Referred</div>
                </div>
                <div className={styles.statItem}>
                    <div className={styles.statValue}>{successfulReferrals}</div>
                    <div className={styles.statLabel}>Successful</div>
                </div>
            </div>
        </div>
    );
};
