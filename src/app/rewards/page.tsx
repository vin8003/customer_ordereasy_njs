'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Gift, Users, CheckCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './Rewards.module.css';

export default function RewardsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [retailers, setRetailers] = useState<any[]>([]);

    // Apply Form State
    const [selectedRetailer, setSelectedRetailer] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, retailersData] = await Promise.all([
                apiService.getReferralStats(),
                apiService.getRetailers() // Fetch retailers for dropdown
            ]);
            setStats(statsData);
            setRetailers(retailersData.results || retailersData);
        } catch (error) {
            console.error("Failed to load rewards data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (stats?.referral_code) {
            navigator.clipboard.writeText(stats.referral_code);
            alert("Referral code copied!");
        }
    };

    const handleApplyCode = async () => {
        if (!selectedRetailer || !referralCode) return;

        setApplying(true);
        try {
            await apiService.applyReferralCode(referralCode, parseInt(selectedRetailer));
            alert("Referral code applied successfully! Points will be awarded after your first order.");
            setReferralCode('');
            setSelectedRetailer('');
            loadData(); // Reload to refresh state if needed
        } catch (error: any) {
            console.error("Apply failed", error);
            const msg = error.response?.data?.error || "Failed to apply code. Only new users can apply referral codes.";
            alert(msg);
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Rewards...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="ghost" onClick={() => router.back()} className="p-0">
                    <ArrowLeft size={24} />
                </Button>
                <h1>Rewards & Referrals</h1>
            </header>

            <div className={styles.content}>
                {/* Section 1: Your Code */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <Gift size={20} className="text-pink-500" />
                        <span>Refer & Earn</span>
                    </div>

                    <div className={styles.codeBox} onClick={handleCopyCode}>
                        <div className={styles.codeLabel}>Your Referral Code</div>
                        <div className={styles.codeValue}>{stats?.referral_code || '---'}</div>
                        <div className={styles.copyHint}>Tap to copy</div>
                    </div>

                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>{stats?.total_referrals || 0}</div>
                            <div className={styles.statLabel}>Friends Referred</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>{stats?.successful_referrals || 0}</div>
                            <div className={styles.statLabel}>Successful</div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Apply Code */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <CheckCircle size={20} className="text-green-500" />
                        <span>Have a Referral Code?</span>
                    </div>

                    <div className={styles.inputGroup}>
                        <div>
                            <label className={styles.label}>Select Retailer</label>
                            <select
                                className={styles.select}
                                value={selectedRetailer}
                                onChange={(e) => setSelectedRetailer(e.target.value)}
                            >
                                <option value="">Choose a shop...</option>
                                {retailers.map((r: any) => (
                                    <option key={r.id} value={r.id}>{r.shop_name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={styles.label}>Referral Code</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Enter code here"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            />
                        </div>

                        <button
                            className={styles.applyButton}
                            onClick={handleApplyCode}
                            disabled={!selectedRetailer || !referralCode || applying}
                        >
                            {applying ? 'Applying...' : 'Apply Code'}
                        </button>
                    </div>
                </div>

                {/* Section 3: History */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <Users size={20} className="text-blue-500" />
                        <span>Referral History</span>
                    </div>

                    {stats?.referrals_detail?.length === 0 ? (
                        <div className={styles.emptyState}>
                            No referrals yet. Invite friends to start earning!
                        </div>
                    ) : (
                        <div className={styles.historyList}>
                            {stats?.referrals_detail?.map((ref: any, index: number) => (
                                <div key={index} className={styles.historyItem}>
                                    <div className={styles.refereeInfo}>
                                        <span className={styles.refereeName}>{ref.referee_name}</span>
                                        <span className={styles.retailerName}>{ref.retailer_name}</span>
                                    </div>
                                    <span className={`${styles.rewardStatus} ${ref.is_rewarded ? styles.rewarded : styles.pending}`}>
                                        {ref.is_rewarded ? 'Rewarded' : 'Pending'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
