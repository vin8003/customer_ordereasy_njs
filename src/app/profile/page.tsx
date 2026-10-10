'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Package, MapPin, ChevronRight, Gift, HelpCircle, Wallet, Pencil, Mail, Phone, Heart, Sparkles, ShieldCheck } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import HelpModal from '@/app/components/HelpModal';
import styles from './Profile.module.css';

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loyaltyPoints, setLoyaltyPoints] = useState<any[]>([]);
    const [creditBalances, setCreditBalances] = useState<any[]>([]);

    const [initials, setInitials] = useState('U');
    const [isGuest, setIsGuest] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        if (!apiService.isAuthenticated()) {
            setIsGuest(true);
            setLoading(false);
            return;
        }

        setLoading(true);
        Promise.all([
            apiService.fetchUserProfile(),
            apiService.getAllCustomerLoyalty(),
        ])
            .then(([profileData, loyaltyData]) => {
                setProfile(profileData);
                setLoyaltyPoints(loyaltyData);
                const init = `${profileData.first_name?.[0] || ''}${profileData.last_name?.[0] || ''}`.toUpperCase() || 'U';
                setInitials(init);
                return apiService.getAllCustomerCredit().catch(() => []);
            })
            .then((creditData) => {
                if (creditData) {
                    setCreditBalances(Array.isArray(creditData) ? creditData : []);
                }
            })
            .catch(err => {
                console.error(err);
                // If 401, maybe token expired or invalid
                setIsGuest(true);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = async () => {
        try {
            await apiService.logout();
            router.push('/login');
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <LoadingScreen message="Loading Profile..." />;

    if (isGuest) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerInner}>
                        <div className={styles.avatar}>
                            <User size={30} />
                        </div>
                        <div className={styles.identity}>
                            <h1 className={styles.name}>Hello, Guest</h1>
                            <p className={`${styles.contact} ${styles.contactWrap}`}>Log in to track orders, save addresses and earn rewards</p>
                        </div>
                    </div>
                </header>
                <main className={styles.main}>
                    <div className={styles.authCard}>
                        <Button fullWidth size="lg" onClick={() => router.push('/login?redirect=/profile')}>Log in</Button>
                        <Button fullWidth size="lg" variant="outline" onClick={() => router.push('/signup')}>Create an account</Button>
                    </div>
                    <div className={styles.section}>
                        <button type="button" onClick={() => setShowHelp(true)} className={styles.menuItem}>
                            <span className={styles.menuIcon}><HelpCircle size={18} /></span>
                            <span className={styles.menuLabel}>Help & Support</span>
                            <ChevronRight size={18} className={styles.menuChevron} />
                        </button>
                        <Link href="/privacy-policy" className={styles.menuItem}>
                            <span className={styles.menuIcon}><ShieldCheck size={18} /></span>
                            <span className={styles.menuLabel}>Privacy Policy</span>
                            <ChevronRight size={18} className={styles.menuChevron} />
                        </Link>
                    </div>
                </main>
                <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
            </div>
        );
    }

    if (!profile) return <div className="p-8 text-center text-[var(--ink-3)]">User not found. Please login.</div>;

    const currentRetailerId = typeof window !== 'undefined' ? localStorage.getItem('current_retailer_id') : null;
    const currentRetailerPoints = currentRetailerId
        ? loyaltyPoints.find(lp => lp.retailer_id.toString() === currentRetailerId)
        : null;
    const totalCurrencyValue = loyaltyPoints.reduce((sum, lp) => {
        return sum + (lp.value_in_currency ? parseFloat(lp.value_in_currency) : parseFloat(lp.points || 0));
    }, 0);
    const cashbackLabel = currentRetailerPoints
        ? `Cashback at ${currentRetailerPoints.retailer_name}`
        : 'Total Cashback Balance';
    const cashbackValue = currentRetailerPoints
        ? (currentRetailerPoints.value_in_currency
            ? Number(currentRetailerPoints.value_in_currency).toFixed(2)
            : currentRetailerPoints.points)
        : totalCurrencyValue.toFixed(2);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.avatar}>
                        {initials}
                    </div>
                    <div className={styles.identity}>
                        <h1 className={styles.name}>{profile.first_name} {profile.last_name}</h1>
                        {profile.email && <p className={styles.contact}><Mail size={13} /> {profile.email}</p>}
                        {profile.phone_number && <p className={styles.contact}><Phone size={13} /> {profile.phone_number}</p>}
                    </div>
                    <Link href="/profile/edit" className={styles.editBtn} aria-label="Edit profile">
                        <Pencil size={16} />
                    </Link>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.quickGrid}>
                    <Link href="/orders" className={styles.quickTile}>
                        <span className={styles.quickIcon}><Package size={20} /></span>
                        Orders
                    </Link>
                    <Link href="/wishlist" className={styles.quickTile}>
                        <span className={`${styles.quickIcon} ${styles.quickRose}`}><Heart size={20} /></span>
                        Wishlist
                    </Link>
                    <Link href="/addresses" className={styles.quickTile}>
                        <span className={`${styles.quickIcon} ${styles.quickGreen}`}><MapPin size={20} /></span>
                        Addresses
                    </Link>
                </div>

                <Link href="/rewards" className={styles.pointsSummary}>
                    <div className={styles.highlightPoints}>
                        <p className={styles.pointsLabel}><Sparkles size={14} /> {cashbackLabel}</p>
                        <p className={styles.pointsValue}>₹{cashbackValue}</p>
                    </div>
                    <span className={styles.pointsCta}>
                        Rewards <ChevronRight size={16} />
                    </span>
                </Link>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>My Account</h2>

                    <Link href="/profile/edit" className={styles.menuItem}>
                        <span className={styles.menuIcon}><Settings size={18} /></span>
                        <span className={styles.menuLabel}>Edit Personal Info</span>
                        <ChevronRight size={18} className={styles.menuChevron} />
                    </Link>

                    <Link href="/orders" className={styles.menuItem}>
                        <span className={styles.menuIcon}><Package size={18} /></span>
                        <span className={styles.menuLabel}>Order History</span>
                        <ChevronRight size={18} className={styles.menuChevron} />
                    </Link>

                    <Link href="/addresses" className={styles.menuItem}>
                        <span className={styles.menuIcon}><MapPin size={18} /></span>
                        <span className={styles.menuLabel}>My Addresses</span>
                        <ChevronRight size={18} className={styles.menuChevron} />
                    </Link>

                    <Link href="/rewards" className={styles.menuItem}>
                        <span className={styles.menuIcon}><Gift size={18} /></span>
                        <span className={styles.menuLabel}>View All Rewards & Referrals</span>
                        <ChevronRight size={18} className={styles.menuChevron} />
                    </Link>

                    <button type="button" onClick={() => setShowHelp(true)} className={styles.menuItem}>
                        <span className={styles.menuIcon}><HelpCircle size={18} /></span>
                        <span className={styles.menuLabel}>Help & Support</span>
                        <ChevronRight size={18} className={styles.menuChevron} />
                    </button>

                    <Link href="/privacy-policy" className={styles.menuItem}>
                        <span className={styles.menuIcon}><ShieldCheck size={18} /></span>
                        <span className={styles.menuLabel}>Privacy Policy</span>
                        <ChevronRight size={18} className={styles.menuChevron} />
                    </Link>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Credit / Khata</h2>
                    {creditBalances.length === 0 ? (
                        <div className={styles.creditEmpty}>
                            <Wallet size={18} />
                            No store credit accounts yet. Balances appear here after you shop on credit.
                        </div>
                    ) : (
                        <div className={styles.creditList}>
                            {creditBalances.map((row: any) => {
                                const limit = Number(row.credit_limit ?? 0);
                                const outstanding = Number(row.current_balance ?? 0);
                                const remaining = Number(row.remaining_credit ?? (limit - outstanding));
                                const usedPct = limit > 0 ? Math.min(100, Math.max(0, (outstanding / limit) * 100)) : 0;
                                return (
                                    <div key={row.retailer_id} className={styles.creditItem}>
                                        <div className={styles.creditShop}>
                                            <span className={styles.creditIcon}><Wallet size={16} /></span>
                                            <span>{row.retailer_name}</span>
                                        </div>
                                        <div className={styles.creditRow}>
                                            <span>Outstanding</span>
                                            <span className={styles.creditStrong}>₹{outstanding.toFixed(2)}</span>
                                        </div>
                                        <div className={styles.creditRow}>
                                            <span>Credit limit</span>
                                            <span>₹{limit.toFixed(2)}</span>
                                        </div>
                                        {limit > 0 && (
                                            <div className={styles.creditBar}>
                                                <div style={{ width: `${usedPct}%` }} />
                                            </div>
                                        )}
                                        <div className={styles.creditRow + ' ' + styles.creditRemaining}>
                                            <span>Remaining credit</span>
                                            <span>₹{remaining.toFixed(2)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                    <LogOut size={18} />
                    Log out
                </button>
            </main>
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </div>
    );
}
