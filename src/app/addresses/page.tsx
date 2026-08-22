'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { ArrowLeft, Plus, MapPin, Trash2, Edit } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { EmptyState } from '@/app/components/EmptyState';
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
            <header className={styles.header}>
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>My Addresses</h1>
                <Button variant="ghost" onClick={() => router.push('/addresses/create')}>
                    <Plus size={24} className="text-primary" />
                </Button>
            </header>

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
                            <div className={styles.cardHeader}>
                                <span className={styles.tag}>{addr.address_type}</span>
                                <div className={styles.actions}>
                                    <button onClick={() => router.push(`/addresses/edit?id=${addr.id}`)} className="text-primary p-2">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(addr.id)} className="text-red-500 p-2">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className={styles.title}>{addr.title || 'Address'}</h3>
                            <p className={styles.text}>{addr.address_line1}</p>
                            {addr.address_line2 && <p className={styles.text}>{addr.address_line2}</p>}
                            <p className={styles.text}>
                                {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
