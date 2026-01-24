'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { ProductImage } from '@/app/components/ProductImage';
import styles from './OrderDetails.module.css';

interface OrderItem {
    id: number;
    product_name: string;
    product_image: string;
    product_price: string;
    quantity: number;
    total_price: string;
}

interface OrderDetail {
    id: number;
    order_number: string;
    retailer_name: string;
    retailer_phone: string;
    retailer_address: string;
    status: string;
    subtotal: string;
    delivery_fee: string;
    discount_amount: string;
    discount_from_points: string;
    total_amount: string;
    delivery_mode: string;
    payment_mode: string;
    special_instructions: string;
    delivery_address_text: string;
    items: OrderItem[];
    created_at: string;
}

function OrderDetails() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [savedRetailerId, setSavedRetailerId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setSavedRetailerId(localStorage.getItem('current_retailer_id'));
        }
    }, []);

    useEffect(() => {
        if (orderId) {
            loadOrderDetails();
        }

        const handleFcmUpdate = (event: any) => {
            const payload = event.detail;
            const updatedOrderId = payload.data?.order_id || payload.data?.id;

            if (Number(updatedOrderId) === Number(orderId)) {
                loadOrderDetails(true);
            }
        };

        window.addEventListener('fcm_order_update', handleFcmUpdate);
        return () => {
            window.removeEventListener('fcm_order_update', handleFcmUpdate);
        };
    }, [orderId]);

    const loadOrderDetails = async (force: boolean = false) => {
        setIsLoading(force && !order ? true : !order); // Only show overlay loading if we don't have order data or explicitly loading first time
        // Actually, let's keep it simple:
        if (!order) setIsLoading(true);

        try {
            const data = await apiService.getOrderDetail(Number(orderId), force);
            setOrder(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!order) return;
        const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
        if (!confirmCancel) return;

        setIsActionLoading(true);
        try {
            await apiService.cancelOrder(order.id);
            loadOrderDetails(true);
        } catch (error) {
            console.error(error);
            alert("Failed to cancel order. Please try again.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleApproval = async (action: 'accept' | 'reject') => {
        if (!order) return;
        setIsActionLoading(true);
        try {
            await apiService.confirmOrderModification(order.id, action);
            loadOrderDetails(true);
        } catch (error) {
            console.error(error);
            alert("Failed to process request. Please try again.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return { color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={24} /> };
            case 'waiting_for_customer_approval': return { color: 'bg-orange-100 text-orange-700', icon: <AlertCircle size={24} /> };
            case 'confirmed': return { color: 'bg-blue-100 text-blue-700', icon: <Package size={24} /> };
            case 'delivered': return { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={24} /> };
            case 'cancelled': return { color: 'bg-red-100 text-red-700', icon: <XCircle size={24} /> };
            default: return { color: 'bg-gray-100 text-gray-700', icon: <Package size={24} /> };
        }
    };

    if (isLoading) return <div className="flex justify-center p-20">Loading...</div>;
    if (!order) return <div className="p-20 text-center">Order not found.</div>;

    const statusInfo = getStatusInfo(order.status);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.push('/orders')}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>Order Details</h1>
                <div className="flex gap-2 items-center">
                    <Button
                        variant="outline"
                        className="text-xs px-3 h-8 flex items-center gap-1"
                        onClick={() => router.push(`/orders/chat?id=${order.id}`)}
                    >
                        <span className="font-semibold">Chat</span>
                    </Button>
                    {savedRetailerId && (
                        <Button variant="outline" className="text-xs px-2 h-8" onClick={() => router.push(`/retailer?id=${savedRetailerId}`)}>
                            Shop
                        </Button>
                    )}
                </div>
            </header>

            <main className={styles.main}>
                <div className={`${styles.statusBanner} ${statusInfo.color}`}>
                    {statusInfo.icon}
                    <div className={styles.statusLabel}>Order {order.status.replace(/_/g, ' ')}</div>
                    <div className={styles.statusValue}>#{order.order_number}</div>
                    <div className={styles.orderInfo}>
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                </div>

                {order.status === 'waiting_for_customer_approval' && (
                    <div className={styles.approvalSection}>
                        <p className={styles.approvalText}>
                            The retailer has modified your order. Please review the changes and approve or reject them.
                        </p>
                        <div className={styles.buttonGroup}>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={() => handleApproval('accept')}
                                isLoading={isActionLoading}
                            >
                                Accept Changes
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 border-red-500 text-red-500"
                                onClick={() => handleApproval('reject')}
                                isLoading={isActionLoading}
                            >
                                Reject & Cancel
                            </Button>
                        </div>
                    </div>
                )}

                <section className={styles.section}>
                    <div className={styles.retailerCard}>
                        <h2 className={styles.retailerName}>{order.retailer_name}</h2>
                        <div className={styles.retailerDetail}>
                            <Phone size={14} /> {order.retailer_phone}
                        </div>
                        <div className={styles.retailerDetail}>
                            <MapPin size={14} /> {order.retailer_address}
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className="font-bold mb-3 text-sm text-gray-500 uppercase">Items</h3>
                    <div className={styles.itemsList}>
                        {order.items.map(item => (
                            <div key={item.id} className={styles.item}>
                                <div className={styles.itemImage}>
                                    <ProductImage src={item.product_image} alt={item.product_name} />
                                </div>
                                <div className={styles.itemDetails}>
                                    <h4 className={styles.itemName}>{item.product_name}</h4>
                                    <p className={styles.itemMeta}>₹{item.product_price} × {item.quantity}</p>
                                </div>
                                <div className={styles.itemPrice}>₹{item.total_price}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className="font-bold mb-3 text-sm text-gray-500 uppercase">Order Summary</h3>
                    <div className={styles.summary}>
                        <div className={styles.summaryRow}>
                            <span>Subtotal</span>
                            <span>₹{order.subtotal}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Delivery Fee ({order.delivery_mode})</span>
                            <span>₹{order.delivery_fee}</span>
                        </div>
                        {parseFloat(order.discount_amount) > 0 && (
                            <div className={styles.summaryRow}>
                                <span>Discount</span>
                                <span className={styles.discount}>-₹{order.discount_amount}</span>
                            </div>
                        )}
                        {parseFloat(order.discount_from_points) > 0 && (
                            <div className={styles.summaryRow}>
                                <span>Points Redeemed</span>
                                <span className={styles.discount}>-₹{order.discount_from_points}</span>
                            </div>
                        )}
                        <div className={styles.totalRow}>
                            <span>Total Amount</span>
                            <span>₹{order.total_amount}</span>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className="font-bold mb-3 text-sm text-gray-500 uppercase">Delivery Info</h3>
                    <div className="flex flex-col gap-2">
                        <div className="text-sm">
                            <span className="text-gray-500">Method:</span> <span className="font-medium capitalize">{order.delivery_mode}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-gray-500">Payment:</span> <span className="font-medium uppercase">{order.payment_mode.replace(/_/g, ' ')}</span>
                        </div>
                        {order.delivery_mode === 'delivery' && (
                            <div className="text-sm">
                                <span className="text-gray-500">Address:</span> <p className="mt-1">{order.delivery_address_text}</p>
                            </div>
                        )}
                    </div>
                </section>

                {order.special_instructions && (
                    <section className={styles.section}>
                        <h3 className="font-bold mb-2 text-sm text-gray-500 uppercase">Notes</h3>
                        <div className={styles.instructionsBox}>{order.special_instructions}</div>
                    </section>
                )}

                {/* Cancel Button */}
                {['pending', 'confirmed', 'processing'].includes(order.status.toLowerCase()) && (
                    <div className="px-4 mt-6">
                        <Button
                            variant="outline"
                            fullWidth
                            className="border-red-500 text-red-600 font-bold hover:bg-red-50"
                            onClick={handleCancelOrder}
                            isLoading={isActionLoading}
                        >
                            Cancel Order
                        </Button>
                        <p className="text-[10px] text-center text-gray-400 mt-2 italic">
                            Orders can only be cancelled before they are packed or out for delivery.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function OrderDetailsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-20">Loading...</div>}>
            <OrderDetails />
        </Suspense>
    );
}
