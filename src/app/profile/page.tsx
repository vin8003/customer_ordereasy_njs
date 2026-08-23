'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Package, MapPin, ChevronRight, Gift, HelpCircle, Wallet } from 'lucide-react';
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
                    <div className={styles.avatar}>
                        <User size={32} />
                    </div>
                    <h1 className={styles.name}>Guest User</h1>
                    <p className={styles.contact}>Login to view your profile</p>
                </header>
                <main className={styles.main}>
                    <div className={styles.section}>
                        <div className="p-4 flex flex-col gap-3">
                            <Button fullWidth onClick={() => router.push('/login?redirect=/profile')}>Login</Button>
                            <Button fullWidth variant="outline" onClick={() => router.push('/signup')}>Sign Up</Button>
                        </div>
                    </div>
                    <div className={styles.section}>
                        <button onClick={() => setShowHelp(true)} className={styles.menuItem}>
                            <div className="flex items-center gap-3">
                                <HelpCircle size={20} className="text-primary" />
                                <span>Help & Support</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                        </button>
                    </div>
                </main>
                <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
            </div>
        );
    }

    if (!profile) return <div className="p-8 text-center">User not found. Please login.</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.avatar}>
                    {initials}
                </div>
                <h1 className={styles.name}>{profile.first_name} {profile.last_name}</h1>
                <p className={styles.contact}>{profile.email}</p>
                <p className={styles.contact}>{profile.phone_number}</p>
            </header>

            <main className={styles.main}>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>My Account</h2>

                    <Link href="/profile/edit" className={styles.menuItem}>
                        <div className="flex items-center gap-3">
                            <Settings size={20} className="text-gray-500" />
                            <span>Edit Personal Info</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </Link>

                    <Link href="/orders" className={styles.menuItem}>
                        <div className="flex items-center gap-3">
                            <Package size={20} className="text-gray-500" />
                            <span>Order History</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </Link>

                    <Link href="/addresses" className={styles.menuItem}>
                        <div className="flex items-center gap-3">
                            <MapPin size={20} className="text-gray-500" />
                            <span>My Addresses</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </Link>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Credit / Khata</h2>
                    {creditBalances.length === 0 ? (
                        <div className={styles.creditEmpty}>
                            No store credit accounts yet. Balances appear here after you shop on credit.
                        </div>
                    ) : (
                        <div className={styles.creditList}>
                            {creditBalances.map((row: any) => {
                                const limit = Number(row.credit_limit ?? 0);
                                const outstanding = Number(row.current_balance ?? 0);
                                const remaining = Number(row.remaining_credit ?? (limit - outstanding));
                                return (
                                    <div key={row.retailer_id} className={styles.creditItem}>
                                        <div className={styles.creditShop}>
                                            <Wallet size={18} className="text-amber-600" />
                                            <span>{row.retailer_name}</span>
                                        </div>
                                        <div className={styles.creditRow}>
                                            <span className="text-gray-500">Outstanding</span>
                                            <span className="font-semibold">₹{outstanding.toFixed(2)}</span>
                                        </div>
                                        <div className={styles.creditRow}>
                                            <span className="text-gray-500">Credit limit</span>
                                            <span className="font-medium">₹{limit.toFixed(2)}</span>
                                        </div>
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

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Rewards</h2>
                    <div className={styles.pointsSummary}>
                        {(() => {
                            const currentRetailerId = typeof window !== 'undefined' ? localStorage.getItem('current_retailer_id') : null;
                            const currentRetailerPoints = currentRetailerId
                                ? loyaltyPoints.find(lp => lp.retailer_id.toString() === currentRetailerId)
                                : null;

                            const totalCurrencyValue = loyaltyPoints.reduce((sum, lp) => {
                                return sum + (lp.value_in_currency ? parseFloat(lp.value_in_currency) : parseFloat(lp.points || 0));
                            }, 0);

                            if (currentRetailerPoints) {
                                const value = currentRetailerPoints.value_in_currency
                                    ? Number(currentRetailerPoints.value_in_currency).toFixed(2)
                                    : currentRetailerPoints.points;
                                return (
                                    <div className={styles.highlightPoints}>
                                        <p className={styles.pointsLabel}>Cashback at {currentRetailerPoints.retailer_name}</p>
                                        <p className={styles.pointsValue}>₹{value}</p>
                                    </div>
                                );
                            }

                            return (
                                <div className={styles.highlightPoints}>
                                    <p className={styles.pointsLabel}>Total Cashback Balance</p>
                                    <p className={styles.pointsValue}>₹{totalCurrencyValue.toFixed(2)}</p>
                                </div>
                            );
                        })()}
                    </div>

                    <Link href="/rewards" className={styles.menuItem}>
                        <div className="flex items-center gap-3">
                            <Gift size={20} className="text-pink-500" />
                            <span>View All Rewards & Referrals</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </Link>

                    <button onClick={() => setShowHelp(true)} className={styles.menuItem}>
                        <div className="flex items-center gap-3">
                            <HelpCircle size={20} className="text-primary" />
                            <span>Help & Support</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </button>
                </div>

                <div className={styles.section}>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </main>
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </div>
    );
}
