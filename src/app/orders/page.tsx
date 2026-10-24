'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ChevronRight, Clock, Star, Store, Loader2, Search, X } from 'lucide-react';
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
    fulfillment_slot_start?: string | null;
    fulfillment_slot_end?: string | null;
    delivery_fee?: string | number | null;
    discount_amount?: string | number | null;
}

import { formatFulfillmentWindow } from '@/lib/fulfillmentSlots';
import { getOrderListMoneyLines } from '@/lib/orderListMoneyLines';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import {
    EMPTY_ORDERS_FILTERS,
    ORDER_STATUS_FILTERS,
    hasOrdersFilters,
    type OrdersFilters,
} from '@/lib/ordersFilters';

export default function OrdersPage() {
    const router = useRouter();
    const { handleBack } = useAppNavigation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreFailed, setLoadMoreFailed] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);
    const [filters, setFilters] = useState<OrdersFilters>(EMPTY_ORDERS_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const filtersRef = useRef(filters);
    filtersRef.current = filters;

    const loadOrders = useCallback(async (pageNum: number = 1, force: boolean = false) => {
        const requested = filtersRef.current;
        setLoadMoreFailed(false);
        if (pageNum === 1) {
            setIsLoading(force ? false : true);
        } else {
            setIsLoadingMore(true);
        }
        try {
            const data = await apiService.getOrders(force, pageNum, requested);
            // The filters changed while this page was loading, so its rows are no longer wanted.
            if (requested !== filtersRef.current) return;
            const results: Order[] = Array.isArray(data) ? data : data?.results || [];
            const nextUrl = data && typeof data === 'object' ? data.next : null;

            setOrders(prev => {
                if (pageNum === 1) return results;
                // A new order shifts the pages, so the first rows of this page can already be listed.
                const listed = new Set(prev.map(order => order.id));
                return [...prev, ...results.filter(order => !listed.has(order.id))];
            });
            setHasMore(Boolean(nextUrl));
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to load orders:', error);
            // The sentinel stays on screen, so without this it would ask for the same page again at once.
            if (pageNum > 1) setLoadMoreFailed(true);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    // Search waits for a pause in typing, so each keystroke does not ask the server.
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => (prev.search === searchInput.trim() ? prev : { ...prev, search: searchInput.trim() }));
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        loadOrders(1);

        const handleFcmUpdate = () => {
            console.log('Orders page refreshing due to FCM update');
            loadOrders(1, true);
        };

        window.addEventListener('fcm_order_update', handleFcmUpdate);
        return () => window.removeEventListener('fcm_order_update', handleFcmUpdate);
    }, [loadOrders, filters]);

    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore && !loadMoreFailed) {
                    loadOrders(page + 1);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(target);
        return () => observer.unobserve(target);
    }, [hasMore, isLoading, isLoadingMore, loadMoreFailed, page, loadOrders]);

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
            <PageHeader title="My Orders" subtitle={orders.length > 0 ? `${orders.length} orders${hasMore ? '+' : ''}` : undefined} onBack={handleBack} />

            <div className={styles.list}>
                <div className={styles.filters}>
                    <label className={styles.searchBox}>
                        <Search size={16} />
                        <input
                            type="search"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Search by order number"
                            aria-label="Search orders by order number"
                        />
                    </label>
                    <div className={styles.chips} role="group" aria-label="Filter by status">
                        {ORDER_STATUS_FILTERS.map(option => (
                            <button
                                type="button"
                                key={option.value}
                                className={`${styles.chip} ${filters.status === option.value ? styles.chipActive : ''}`}
                                aria-pressed={filters.status === option.value}
                                onClick={() => setFilters(prev => ({ ...prev, status: option.value }))}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <div className={styles.dates}>
                        <label>
                            <span>From</span>
                            <input
                                type="date"
                                value={filters.startDate}
                                max={filters.endDate || undefined}
                                onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </label>
                        <label>
                            <span>To</span>
                            <input
                                type="date"
                                value={filters.endDate}
                                min={filters.startDate || undefined}
                                onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </label>
                        {hasOrdersFilters({ ...filters, search: searchInput }) && (
                            <button
                                type="button"
                                className={styles.clearFilters}
                                onClick={() => { setSearchInput(''); setFilters(EMPTY_ORDERS_FILTERS); }}
                            >
                                <X size={14} /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {isLoading && orders.length === 0 && (
                    [0, 1, 2].map((i) => <div key={i} className={`oe-skeleton ${styles.skeleton}`} />)
                )}

                {orders.length === 0 && !isLoading && hasOrdersFilters(filters) && (
                    <EmptyState
                        icon={Search}
                        title="No matching orders"
                        description="Try a different status, date range or order number."
                    />
                )}

                {orders.length === 0 && !isLoading && !hasOrdersFilters(filters) && (
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

                        {(order.expected_processing_start && order.status.toLowerCase() === 'pending') || order.is_returned || order.feedback || order.fulfillment_slot_start ? (
                            <div className={styles.tags}>
                                {order.fulfillment_slot_start && (
                                    <span className={styles.tagWarn}>
                                        <Clock size={12} />
                                        {formatFulfillmentWindow(order.fulfillment_slot_start, order.fulfillment_slot_end)}
                                    </span>
                                )}
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
                                {getOrderListMoneyLines(order).map((line) => (
                                    <span key={line.key} className={styles.amountLabel}>
                                        {line.label} {line.amountDisplay}
                                    </span>
                                ))}
                            </div>
                            <span className={styles.viewDetails}>
                                View details <ChevronRight size={16} />
                            </span>
                        </div>
                    </button>
                ))}

                {orders.length > 0 && hasMore && (
                    <div ref={observerTarget} style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                        {isLoadingMore && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-3)', fontSize: '0.875rem' }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Loading more orders...</span>
                            </div>
                        )}
                        {loadMoreFailed && (
                            <button
                                type="button"
                                onClick={() => loadOrders(page + 1)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: '0.875rem', textDecoration: 'underline' }}
                            >
                                Could not load more orders. Tap to retry
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
