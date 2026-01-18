'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Settings, LogOut, Package, MapPin, ChevronRight, Gift } from 'lucide-react';
import { apiService } from '@/services/api';
import styles from './Profile.module.css';

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiService.fetchUserProfile()
            .then(data => setProfile(data))
            .catch(err => console.error(err))
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;
    if (!profile) return <div className="p-8 text-center">User not found. Please login.</div>;

    const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'U';

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
                    <h2 className={styles.sectionTitle}>Rewards</h2>
                    <Link href="/rewards" className={styles.menuItem}>
                        <div className="flex items-center gap-3">
                            <Gift size={20} className="text-pink-500" />
                            <span>Rewards & Referrals</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </Link>
                </div>

                <div className={styles.section}>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </main>
        </div>
    );
}

