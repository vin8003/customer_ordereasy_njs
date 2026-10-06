'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Plus, MapPin, Trash2, Edit } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { EmptyState } from '@/app/components/EmptyState';
import PageHeader from '@/app/components/PageHeader';
import styles from './Addresses.module.css';

export default function AddressesPage() {
    const router = useRouter();
    const { handleBack } = useAppNavigation();
    const [addresses, setAddresses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getAddresses();
            setAddresses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            await apiService.deleteAddress(id);
            setAddresses(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className={styles.container}>
            <PageHeader title="My Addresses" onBack={handleBack} right={
                <Button size="sm" onClick={() => router.push('/addresses/create')}>
                    <Plus size={16} /> Add new
                </Button>
            } />

            <div className={styles.list}>
                {isLoading ? (
                    <LoadingScreen message="Loading addresses..." />
                ) : addresses.length === 0 ? (
                    <EmptyState
                        icon={MapPin}
                        title="No addresses yet"
                        description="Add a delivery address to check out faster next time."
                        actionLabel="Add New Address"
                        onAction={() => router.push('/addresses/create')}
                    />
                ) : (
                    addresses.map(addr => (
                        <div key={addr.id} className={styles.card}>
                            <span className={styles.pinIcon}><MapPin size={18} /></span>
                            <div className={styles.body}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.title}>{addr.title || 'Address'}</h3>
                                    <span className={styles.tag}>{addr.address_type}</span>
                                </div>
                                <p className={styles.text}>{addr.address_line1}</p>
                                {addr.address_line2 && <p className={styles.text}>{addr.address_line2}</p>}
                                <p className={styles.text}>
                                    {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                            </div>
                            <div className={styles.actions}>
                                <button
                                    type="button"
                                    onClick={() => router.push(`/addresses/edit?id=${addr.id}`)}
                                    className={styles.actionBtn}
                                    aria-label="Edit address"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(addr.id)}
                                    className={`${styles.actionBtn} ${styles.actionDanger}`}
                                    aria-label="Delete address"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
