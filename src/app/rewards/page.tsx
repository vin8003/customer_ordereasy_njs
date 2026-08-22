'use client';
import toast from '@/lib/toast';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { ArrowLeft, CheckCircle, Users, Gem, History, Clock, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { ReferralCard } from '@/app/components/ReferralCard';
import styles from './Rewards.module.css';

export default function RewardsPage() {
    const router = useRouter();
    const { handleBack } = useAppNavigation();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [retailers, setRetailers] = useState<any[]>([]);
    const [loyaltyPoints, setLoyaltyPoints] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);

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
            const [statsData, retailersData, loyaltyData, transactionsData] = await Promise.all([
                apiService.getReferralStats(),
                apiService.getRetailers({ has_referral: true }), // Fetch only retailers with active referral programs
                apiService.getAllCustomerLoyalty(),
                apiService.getLoyaltyTransactions()
            ]);
            setStats(statsData);
            setRetailers(retailersData.results || retailersData);
            setLoyaltyPoints(loyaltyData);
            setTransactions(transactionsData);
        } catch (error) {
            console.error("Failed to load rewards data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (stats?.referral_code) {
            navigator.clipboard.writeText(stats.referral_code);
            // Optionally could use a toast here
            toast.success("Referral code copied!");
        }
    };

    const handleApplyCode = async () => {
        if (!selectedRetailer || !referralCode) return;

        setApplying(true);
        try {
            await apiService.applyReferralCode(referralCode, parseInt(selectedRetailer));
            toast.success("Referral code applied successfully! Points will be awarded after your first order.");
            setReferralCode('');
            setSelectedRetailer('');
            loadData(); // Reload to refresh state if needed
        } catch (error: any) {
            console.error("Apply failed", error);
            const msg = error.response?.data?.error || "Failed to apply code. Only new users can apply referral codes.";
            // global error interceptor handles this
            console.error(error);
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <LoadingScreen message="Loading Rewards..." />;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="ghost" onClick={handleBack} className="p-0">
                    <ArrowLeft size={24} />
                </Button>
                <h1>Rewards & Referrals</h1>
            </header>

            <div className={styles.content}>

                {/* Visual Hierarchy: Refer & Earn first as it's the main engaging action */}
                <div className={styles.card}>
                    <ReferralCard
                        referralCode={stats?.referral_code}
                        totalReferrals={stats?.total_referrals || 0}
                        successfulReferrals={stats?.successful_referrals || 0}
                        onCopy={handleCopyCode}
                    />

                    {/* Active Schemes List */}
                    {stats?.active_referral_schemes?.length > 0 && (
                        <div className={styles.activeSchemesList}>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Active Offers Nearby</h4>
                            {stats.active_referral_schemes.map((scheme: any) => (
                                <div key={scheme.retailer_id} className={styles.schemeItem}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-sm text-gray-800">{scheme.retailer_name}</span>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">₹{scheme.referral_reward_points} Reward</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Min order: ₹{scheme.min_referral_order_amount} | Your friend gets ₹{scheme.referee_reward_points}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section: Your Loyalty Points */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <Gem size={20} className="text-indigo-500" />
                        <span>Store Points Balance</span>
                    </div>
                    {loyaltyPoints.length === 0 ? (
                        <div className={styles.emptyState}>
                            No points earned yet. Shop from your favorite stores to earn points!
                        </div>
                    ) : (
                        <div className={styles.loyaltyList}>
                            {loyaltyPoints.map((lp: any, index: number) => (
                                <div key={index} className={styles.loyaltyItem}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className={styles.shopName}>{lp.retailer_name}</span>
                                            <div className="flex items-center gap-1">
                                              <span className={styles.pointsCount}>{lp.points} pts</span>
                                              <span className={styles.pointsValue}>≈ ₹{lp.value_in_currency}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {lp.next_expiry_date && (
                                              <div className={styles.expiryBadge}>
                                                <Clock size={10} />
                                                <span>
                                                  {lp.points_expiring_soon} pts expire {new Date(lp.next_expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                              </div>
                                            )}
                                            <Button 
                                                variant="outline" 
                                                className="h-8 px-3 text-xs font-bold border-indigo-200 text-indigo-600"
                                                onClick={() => router.push(`/retailer?id=${lp.retailer_id}`)}
                                            >
                                                Shop
                                            </Button>
                                        </div>
                                    </div>
                                    <div className={styles.conversionRule}>
                                        <Info size={10} /> 1 Pt = ₹{lp.conversion_rate}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section: Loyalty History */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <History size={20} className="text-blue-500" />
                        <span>Transaction History</span>
                    </div>

                    {transactions.length === 0 ? (
                        <div className={styles.emptyState}>
                            No transactions yet.
                        </div>
                    ) : (
                        <div className={styles.transactionList}>
                            {transactions.map((tx: any) => (
                                <div key={tx.id} className={styles.transactionItem}>
                                    <div className={styles.txIconBox}>
                                        {tx.transaction_type === 'earn' || tx.transaction_type === 'refund' ? (
                                            <TrendingUp size={16} className="text-green-500" />
                                        ) : (
                                            <TrendingDown size={16} className="text-red-500" />
                                        )}
                                    </div>
                                    <div className={styles.txInfo}>
                                        <div className="flex justify-between items-baseline">
                                            <span className={styles.txRetailer}>{tx.retailer_name}</span>
                                            <span className={`${styles.txAmount} ${tx.transaction_type === 'earn' || tx.transaction_type === 'refund' ? styles.positive : styles.negative}`}>
                                                {tx.transaction_type === 'earn' || tx.transaction_type === 'refund' ? '+' : '-'}{tx.amount}
                                            </span>
                                        </div>
                                        <p className={styles.txDesc}>{tx.description}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                            {tx.expiry_date && !tx.is_expired && (
                                                <span className={styles.txExpiry}>Valid till {new Date(tx.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section: Apply Code */}
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

                {/* Section: History */}
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
                                <div key={index} className={styles.historyItemStyle}>
                                    <div className="flex justify-between items-start">
                                        <div className={styles.refereeInfo}>
                                            <span className={styles.refereeName}>{ref.referee_name}</span>
                                            <span className={styles.retailerName}>{ref.retailer_name}</span>
                                        </div>
                                        <span className={`${styles.rewardStatus} ${ref.is_rewarded ? styles.rewarded : styles.pending}`}>
                                            {ref.is_rewarded ? 'Rewarded' : 'Pending'}
                                        </span>
                                    </div>
                                    
                                    {ref.reward_rules && (
                                        <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between items-center">
                                            <div className="flex gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-gray-400 uppercase font-bold">You'll Get</span>
                                                    <span className="text-xs font-bold text-blue-600">₹{ref.reward_rules.your_reward}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-gray-400 uppercase font-bold">They'll Get</span>
                                                    <span className="text-xs font-bold text-indigo-600">₹{ref.reward_rules.friend_reward}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] text-gray-400 uppercase font-bold block">Condition</span>
                                                <span className="text-[10px] text-gray-600">Order {'>'} ₹{ref.reward_rules.min_order_condition}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
