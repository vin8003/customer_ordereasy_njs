'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ChevronRight, Clock, Star, Store } from 'lucide-react';
import { apiService } from '@/services/api';
import PageHeader from '@/app/components/PageHeader';
import { EmptyState } from '@/app/components/EmptyState';
import styles from './Orders.module.css';

interface Order {
    id: number;
    order_number: string;
    total_amount: string;
    status: string;
    created_at: string;
    retailer_name?: string;
    feedback?: {
        overall_rating: number;
        comment: string;
    };
    expected_processing_start?: string;
    net_amount?: string;
    refund_amount?: string;
    is_returned?: boolean;
}

import { useAppNavigation } from '@/hooks/useAppNavigation';

export default function OrdersPage() {
    const router = useRouter();
    const { handleBack } = useAppNavigation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadOrders();

        const handleFcmUpdate = () => {
            console.log('Orders page refreshing due to FCM update');
            loadOrders(true);
        };

        window.addEventListener('fcm_order_update', handleFcmUpdate);
        return () => window.removeEventListener('fcm_order_update', handleFcmUpdate);
    }, []);

    const loadOrders = async (force: boolean = false) => {
        setIsLoading(force ? false : true); // Show loading only for initial load, not for foreground refreshes
        try {
            const data = await apiService.getOrders(force);
            setOrders(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusTone = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered': return styles.toneSuccess;
            case 'cancelled': return styles.toneDanger;
            case 'pending': return styles.toneWarn;
            default: return styles.toneInfo;
        }
    };

    const formatDate = (value: string) =>
        new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className={styles.container}>
            <PageHeader title="My Orders" subtitle={orders.length > 0 ? `${orders.length} orders` : undefined} onBack={handleBack} />

            <div className={styles.list}>
                {isLoading && orders.length === 0 && (
                    [0, 1, 2].map((i) => <div key={i} className={`oe-skeleton ${styles.skeleton}`} />)
                )}

                {orders.length === 0 && !isLoading && (
                    <EmptyState
                        icon={Package}
                        title="No orders yet"
                        description="When you place an order, it will show up here."
                        actionLabel="Start shopping"
                        onAction={() => router.push('/retailers')}
                    />
                )}

                {orders.map(order => (
                    <button
                        type="button"
                        key={order.id}
                        className={styles.card}
                        onClick={() => router.push(`/orders/detail?id=${order.id}`)}
                    >
                        <div className={styles.cardHeader}>
                            <span className={styles.storeIcon}><Store size={18} /></span>
                            <div className={styles.cardTitle}>
                                <h3>{order.retailer_name || 'Retailer'}</h3>
                                <p>
                                    #{order.order_number} · {formatDate(order.created_at)}
                                </p>
                            </div>
                            <span className={`${styles.status} ${getStatusTone(order.status)}`}>
                                {order.status.replace(/_/g, ' ')}
                            </span>
                        </div>

                        {(order.expected_processing_start && order.status.toLowerCase() === 'pending') || order.is_returned || order.feedback ? (
                            <div className={styles.tags}>
                                {order.expected_processing_start && order.status.toLowerCase() === 'pending' && (
                                    <span className={styles.tagWarn}>
                                        <Clock size={12} />
                                        Processing starts later
                                    </span>
                                )}
                                {order.is_returned && (
                                    <span className={styles.tagDanger}>
                                        <Package size={12} />
                                        Items returned
                                    </span>
                                )}
                                {order.feedback && (
                                    <span className={styles.tagRating}>
                                        <Star size={12} fill="currentColor" />
                                        {order.feedback.overall_rating} rated
                                    </span>
                                )}
                            </div>
                        ) : null}

                        <div className={styles.cardFooter}>
                            <div className={styles.amount}>
                                <span className={styles.amountLabel}>{order.is_returned ? 'Net Amount' : 'Total Amount'}</span>
                                <span className={styles.amountValue}>
                                    ₹{order.is_returned ? order.net_amount : order.total_amount}
                                    {order.is_returned && (
                                        <s>₹{order.total_amount}</s>
                                    )}
                                </span>
                            </div>
                            <span className={styles.viewDetails}>
                                View details <ChevronRight size={16} />
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
