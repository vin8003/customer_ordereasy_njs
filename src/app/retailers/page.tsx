'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, ShoppingBag, Star, Clock } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './Retailers.module.css';

interface Retailer {
    id: number;
    shop_name: string;
    business_type: string;
    city: string;
    state: string;
    average_rating: number;
    offers_delivery: boolean;
    offers_pickup: boolean;
    shop_image?: string;
    distance?: number;
}

export default function RetailersPage() {
    const router = useRouter();
    const [retailers, setRetailers] = useState<Retailer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRetailers();
    }, []);

    const fetchRetailers = async () => {
        setIsLoading(true);
        try {
            // In a real scenario, we'd get lat/lng here
            const data = await apiService.getRetailers();
            setRetailers(data.results || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load retailers. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetailerSelect = (id: number) => {
        router.push(`/retailer/${id}`);
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Finding stores near you...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Select a Store</h1>
                <p>Choose a retailer to start shopping</p>
            </header>

            {error && (
                <div className={styles.errorContainer}>
                    <p>{error}</p>
                    <Button onClick={fetchRetailers} variant="outline">Retry</Button>
                </div>
            )}

            {retailers.length === 0 && !error ? (
                <div className={styles.emptyState}>
                    <ShoppingBag size={48} />
                    <p>No retailers found in your area.</p>
                </div>
            ) : (
                <div className={styles.retailerList}>
                    {retailers.map((retailer) => (
                        <div
                            key={retailer.id}
                            className={styles.retailerCard}
                            onClick={() => handleRetailerSelect(retailer.id)}
                        >
                            <div className={styles.cardContent}>
                                <div className={styles.retailerIcon}>
                                    <ShoppingBag size={24} color="#fff" />
                                </div>
                                <div className={styles.retailerInfo}>
                                    <h2>{retailer.shop_name}</h2>
                                    <p className={styles.type}>{retailer.business_type}</p>

                                    <div className={styles.metaRow}>
                                        <span className={styles.metaItem}>
                                            <MapPin size={14} />
                                            {retailer.city}, {retailer.state}
                                        </span>
                                        <span className={styles.metaItem}>
                                            <Star size={14} className={styles.starIcon} />
                                            {retailer.average_rating}
                                        </span>
                                    </div>

                                    <div className={styles.tags}>
                                        {retailer.offers_delivery && (
                                            <span className={styles.tag}>Delivery</span>
                                        )}
                                        {retailer.offers_pickup && (
                                            <span className={styles.tag}>Pickup</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
