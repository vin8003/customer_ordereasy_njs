'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, MapPin, Trash2, Edit } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './Addresses.module.css';

export default function AddressesPage() {
    const router = useRouter();
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
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>My Addresses</h1>
                <Button variant="ghost" onClick={() => router.push('/addresses/create')}>
                    <Plus size={24} className="text-blue-600" />
                </Button>
            </header>

            <div className={styles.list}>
                {isLoading ? (
                    <div className="text-center p-8 text-gray-500">Loading addresses...</div>
                ) : addresses.length === 0 ? (
                    <div className="text-center p-12 text-gray-400">
                        <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No addresses found.</p>
                        <Button className="mt-4" onClick={() => router.push('/addresses/create')}>
                            Add New Address
                        </Button>
                    </div>
                ) : (
                    addresses.map(addr => (
                        <div key={addr.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.tag}>{addr.address_type}</span>
                                <div className={styles.actions}>
                                    <button onClick={() => router.push(`/addresses/${addr.id}/edit`)} className="text-blue-500 p-2">
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
