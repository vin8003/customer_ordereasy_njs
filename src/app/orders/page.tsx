'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, ChevronRight, Clock, Star } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { EmptyState } from '@/app/components/EmptyState';
import OrderFulfillmentHighlight from '@/app/components/OrderFulfillmentHighlight';
import { formatFulfillmentWindow, OrderDeliveryInfo } from '@/lib/fulfillmentSlots';
import { getOrderStatusDisplay, needsFulfillmentDetailEnrichment } from '@/lib/orderFulfillmentDisplay';
import { visibleOrderListEtaMinutes } from '@/lib/orderListEtaMinutes';
import styles from './Orders.module.css';

interface Order {
    id: number;
    order_number: string;
    total_amount: string;
    status: string;
    created_at: string;
    delivery_mode?: string;
    retailer_name?: string;
    eta_minutes?: string | number | null;
    fulfillment_slot_start?: string | null;
    fulfillment_slot_end?: string | null;
    pickup_code?: string | null;
    pickup_ready_at?: string | null;
    delivery_info?: OrderDeliveryInfo | null;
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

async function enrichOrdersWithFulfillmentDetail(orders: Order[]): Promise<Order[]> {
    const targets = orders.filter(needsFulfillmentDetailEnrichment);
    if (targets.length === 0) return orders;

    const details = await Promise.all(
        targets.map(async (order) => {
            try {
                const detail = await apiService.getOrderDetail(order.id);
                return {
                    id: order.id,
                    pickup_code: detail.pickup_code as string | null | undefined,
                    pickup_ready_at: detail.pickup_ready_at as string | null | undefined,
                    delivery_info: detail.delivery_info as OrderDeliveryInfo | null | undefined,
                };
            } catch {
                return { id: order.id };
            }
        })
    );

    const byId = new Map(details.map((d) => [d.id, d]));
    return orders.map((order) => {
        const extra = byId.get(order.id);
        return extra ? { ...order, ...extra } : order;
    });
}

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
            const list = Array.isArray(data) ? data : data.results || [];
            const enriched = await enrichOrdersWithFulfillmentDetail(list);
            setOrders(enriched);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadgeClass = (status: string, deliveryMode?: string) => {
        return getOrderStatusDisplay(status, deliveryMode).badgeClass;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>My Orders</h1>
                <div className="h-5" />
            </header>

            <div className={styles.list}>
                {orders.length === 0 && !isLoading && (
                    <EmptyState
                        icon={Package}
                        title="No orders yet"
                        description="When you place an order, it will show up here."
                    />
                )}

                {orders.map(order => {
                    const etaMinutes = visibleOrderListEtaMinutes(order);
                    return (
                    <div
                        key={order.id}
                        className={`${styles.card} cursor-pointer active:scale-[0.98] transition-all`}
                        onClick={() => router.push(`/orders/detail?id=${order.id}`)}
                    >
                        <div className={styles.cardHeader}>
                            <div>
                                <h3 className="font-bold text-gray-800">Order #{order.order_number}</h3>
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <Clock size={12} />
                                    {new Date(order.created_at).toLocaleDateString()}
                                </div>
                                {etaMinutes ? (
                                    <p className={styles.etaMinutes}>
                                        <Clock size={12} />
                                        {etaMinutes}
                                    </p>
                                ) : null}
                                {order.expected_processing_start && order.status.toLowerCase() === 'pending' && (
                                    <div className="text-xs text-orange-600 flex items-center gap-1 mt-1 font-medium bg-orange-50 px-2 py-0.5 rounded-md w-fit border border-orange-100">
                                        <Clock size={12} />
                                        Processing starts later
                                    </div>
                                )}
                                {order.fulfillment_slot_start && (
                                    <div className="text-xs text-indigo-700 flex items-center gap-1 mt-1 font-medium bg-indigo-50 px-2 py-0.5 rounded-md w-fit border border-indigo-100">
                                        <Clock size={12} />
                                        {order.delivery_mode === 'pickup' ? 'Pickup' : 'Delivery'}:{' '}
                                        {formatFulfillmentWindow(order.fulfillment_slot_start, order.fulfillment_slot_end)}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-bold border uppercase ${getStatusBadgeClass(order.status, order.delivery_mode)}`}
                                >
                                    {getOrderStatusDisplay(order.status, order.delivery_mode).label}
                                </span>
                                {order.feedback && (
                                    <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold border border-yellow-200">
                                        <span>{order.feedback.overall_rating}</span>
                                        <Star size={12} className="fill-yellow-500 text-yellow-500" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <OrderFulfillmentHighlight
                            delivery_mode={order.delivery_mode}
                            status={order.status}
                            pickup_code={order.pickup_code}
                            pickup_ready_at={order.pickup_ready_at}
                            delivery_info={order.delivery_info}
                            variant="compact"
                        />

                        <div className="mt-3 flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-500">Retailer</p>
                                <p className="font-medium text-sm">{order.retailer_name || 'Retailer'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 text-right">{order.is_returned ? 'Net Amount' : 'Total Amount'}</p>
                                <div className="flex flex-col items-end">
                                    {order.is_returned && (
                                        <span className="text-[10px] line-through text-gray-400">₹{order.total_amount}</span>
                                    )}
                                    <p className="font-bold text-primary">₹{order.is_returned ? order.net_amount : order.total_amount}</p>
                                </div>
                            </div>
                        </div>

                        {order.is_returned && (
                            <div className="mt-2 flex items-center gap-1.5 bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold border border-red-100 w-fit">
                                <Package size={12} />
                                ITEMS RETURNED
                            </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
                            <span className="text-xs font-bold text-primary flex items-center gap-1">
                                View Details <ChevronRight size={14} />
                            </span>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
}
