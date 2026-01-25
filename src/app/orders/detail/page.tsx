'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, Package, Clock, CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react';
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
    has_customer_feedback?: boolean;
}

function OrderDetails() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [savedRetailerId, setSavedRetailerId] = useState<string | null>(null);

    // Rating State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

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

    const handleRateOrder = async () => {
        if (!order || rating === 0) return;

        setIsRatingSubmitting(true);
        try {
            await apiService.createOrderFeedback(order.id, {
                overall_rating: rating,
                product_quality_rating: rating,
                delivery_rating: rating,
                service_rating: rating,
                comment: comment
            });
            setShowRatingModal(false);
            // Refresh order details to show "You rated this order" state
            loadOrderDetails(true);
        } catch (error) {
            console.error('Rating failed:', error);
            alert("Failed to submit rating. Please try again.");
        } finally {
            setIsRatingSubmitting(false);
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

                {/* Rating Button */}
                {order.status.toLowerCase() === 'delivered' && (
                    <div className="px-4 mt-6 mb-8">
                        {!order.has_customer_feedback ? (
                            <Button
                                variant="primary"
                                fullWidth
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => setShowRatingModal(true)}
                            >
                                <Star className="mr-2" size={18} fill="currentColor" />
                                Rate Store
                            </Button>
                        ) : (
                            <div className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                                <CheckCircle size={18} className="mr-2" />
                                <span className="font-semibold">You rated this order</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Rating Modal */}
                {showRatingModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b">
                                <h3 className="text-lg font-bold text-center">Rate Your Order</h3>
                            </div>

                            <div className="p-6">
                                <p className="text-center text-gray-600 mb-6">How was your experience with {order.retailer_name}?</p>

                                <div className="flex justify-center gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none transition-transform active:scale-95"
                                        >
                                            <Star
                                                size={32}
                                                className={`${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-sm"
                                    placeholder="Add a comment (optional)..."
                                    rows={3}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            <div className="p-4 border-t bg-gray-50 flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowRatingModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    disabled={rating === 0 || isRatingSubmitting}
                                    onClick={handleRateOrder}
                                    isLoading={isRatingSubmitting}
                                >
                                    Submit
                                </Button>
                            </div>
                        </div>
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
