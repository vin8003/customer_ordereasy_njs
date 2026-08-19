'use client';
import toast from 'react-hot-toast';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, Package, Clock, CheckCircle, XCircle, AlertCircle, Star, MessageCircle, Loader2 } from 'lucide-react';
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
    net_quantity?: number;
    returned_quantity?: number;
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
    refund_amount?: string;
    net_amount?: string;
    delivery_mode: string;
    payment_mode: string;
    credit_amount?: string | number;
    credit_limit?: number | string | null;
    current_balance?: number | string | null;
    ledger_previous_balance?: number | string | null;
    ledger_new_balance?: number | string | null;
    special_instructions: string;
    delivery_address_text: string;
    items: OrderItem[];
    created_at: string;
    has_customer_feedback?: boolean;
    feedback?: any;
    preparation_time_minutes?: number;
    estimated_ready_time?: string;
    expected_processing_start?: string;
    cancelled_by?: string;
    retailer_upi_id?: string;
    retailer_upi_qr_code?: string;
    payment_reference_id?: string;
    payment_status?: string;
    payment_edit_count?: number;
    is_payment_locked?: boolean;
}

function OrderDetails() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Rating State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
    const [referenceId, setReferenceId] = useState('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [isEditingPayment, setIsEditingPayment] = useState(false);


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
            // global error interceptor handles this
            console.error(error);
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
            // global error interceptor handles this
            console.error(error);
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
            // global error interceptor handles this
        } finally {
            setIsRatingSubmitting(false);
        }
    };

    const handleSubmitPayment = async () => {
        if (!order) return;
        
        const cleanRefId = referenceId.trim();
        if (!cleanRefId) {
            toast.error("Please enter a transaction ID");
            return;
        }

        // 12-digit numeric validation
        if (!/^\d{12}$/.test(cleanRefId)) {
            toast.error("Invalid ID format. Please enter exactly 12 digits from your UPI app.");
            return;
        }

        setIsSubmittingPayment(true);
        try {
            await apiService.submitOrderPayment(order.id, cleanRefId);
            toast.success("Transaction ID submitted successfully!");
            setReferenceId('');
            setIsEditingPayment(false);
            await loadOrderDetails(true);
        } catch (error: any) {
            console.error('Payment submission failed:', error);
            const errorMsg = error.response?.data?.error || "Failed to submit payment details.";
            toast.error(errorMsg);
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const getPaymentStatusInfo = (status: string) => {
        switch (status) {
            case 'pending_payment': 
                return { label: 'Pending Payment', color: 'text-amber-600', icon: <Clock size={16} /> };
            case 'pending_verification': 
                return { label: 'Pending Verification', color: 'text-blue-600', icon: <Loader2 size={16} className="animate-spin" /> };
            case 'verified': 
                return { label: 'Verified', color: 'text-green-600', icon: <CheckCircle size={16} /> };
            case 'failed': 
                return { label: 'Verification Failed', color: 'text-red-600', icon: <XCircle size={16} /> };
            default: 
                return { label: status, color: 'text-gray-600', icon: <Clock size={16} /> };
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

    if (isLoading) return <LoadingScreen message="Loading..." />;
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
                    <button
                        onClick={() => router.push(`/orders/chat?id=${order.id}`)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '999px',
                            padding: '7px 16px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(22,163,74,0.35)',
                            letterSpacing: '0.01em',
                        }}
                    >
                        <MessageCircle size={16} />
                        Chat
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                <div className={`${styles.statusBanner} ${statusInfo.color}`}>
                    {statusInfo.icon}
                    <div className={styles.statusLabel}>Order {order.status.replace(/_/g, ' ')}</div>
                    {order.status.toLowerCase() === 'cancelled' && order.cancelled_by && (
                        <div className="text-sm font-bold opacity-90 mt-1 uppercase">
                            By {order.cancelled_by}
                        </div>
                    )}
                    <div className={styles.statusValue}>#{order.order_number}</div>
                    <div className={styles.orderInfo}>
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                </div>

                {/* UPI Payment Section */}
                {order.payment_mode === 'upi' && order.status !== 'cancelled' && (
                    <div className={styles.upipaymentSection}>
                        <div className={styles.upipaymentHeader}>
                            <div className={styles.upipaymentIcon}>
                                <AlertCircle size={24} />
                            </div>
                            <h3 className={styles.upipaymentTitle}>UPI Payment Details</h3>
                        </div>
                        
                        {(!order.payment_reference_id || isEditingPayment) ? (
                            <>
                                <p className={styles.upipaymentDescription}>
                                    Please complete the payment and provide the transaction ID below.
                                </p>

                                <div className={styles.qrContainer}>
                                    {order.retailer_upi_qr_code ? (
                                        <div className={styles.qrWrapper}>
                                            <img 
                                                src={order.retailer_upi_qr_code} 
                                                alt="UPI QR Code" 
                                                className={styles.qrImage}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 italic">No QR Code available</div>
                                    )}
                                    
                                    <div className={styles.upiIdContainer}>
                                        <span className={styles.upiIdLabel}>UPI ID</span>
                                        <div className={styles.upiIdValue}>
                                            {order.retailer_upi_id || "Not Provided"}
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (order.retailer_upi_id) {
                                                    navigator.clipboard.writeText(order.retailer_upi_id);
                                                    toast.success("UPI ID copied!");
                                                }
                                            }}
                                            className={styles.copyButton}
                                        >
                                            Copy UPI ID
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Transaction ID / Reference Number</label>
                                    <input 
                                        type="text"
                                        className={styles.inputField}
                                        placeholder="Enter 12-digit UPI Ref No."
                                        value={referenceId}
                                        onChange={(e) => setReferenceId(e.target.value)}
                                    />
                                    {order.payment_edit_count !== undefined && order.payment_edit_count > 0 && (
                                        <p className="text-[10px] text-amber-600 font-bold mb-1">
                                            Edit attempt {order.payment_edit_count} of 3
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="primary" 
                                            fullWidth 
                                            onClick={handleSubmitPayment}
                                            isLoading={isSubmittingPayment}
                                            disabled={isSubmittingPayment || !referenceId.trim()}
                                        >
                                            {order.payment_reference_id ? 'Update Details' : 'Submit Details'}
                                        </Button>
                                        {isEditingPayment && (
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setIsEditingPayment(false)}
                                                disabled={isSubmittingPayment}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 text-center">
                                        You can edit transaction ID until verification
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className={styles.upiIdLabel}>Submitted Trans. ID</span>
                                            <div className="font-mono font-bold text-gray-800 break-all">{order.payment_reference_id}</div>
                                        </div>
                                        
                                        {!order.is_payment_locked && (order.payment_edit_count || 0) < 3 && (
                                            <button 
                                                onClick={() => {
                                                    setReferenceId(order.payment_reference_id || '');
                                                    setIsEditingPayment(true);
                                                }}
                                                className="text-primary text-xs font-bold px-3 py-1 bg-primary/10 rounded-lg"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <span className="text-xs text-gray-500 font-bold uppercase">Status:</span>
                                        <div className={`flex items-center gap-1.5 text-sm font-bold ${getPaymentStatusInfo(order.payment_status || '').color}`}>
                                            {getPaymentStatusInfo(order.payment_status || '').icon}
                                            {getPaymentStatusInfo(order.payment_status || '').label}
                                        </div>
                                    </div>
                                    
                                    {order.payment_status === 'failed' && (
                                        <p className="text-xs text-red-500 mt-2 italic">
                                            Verification failed. Please check your transaction ID and edit if incorrect.
                                        </p>
                                    )}
                                </div>
                                
                                {order.is_payment_locked && (
                                    <p className="text-[10px] text-green-600 font-bold text-center">
                                        Payment verified and locked. No further edits allowed.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {order.expected_processing_start && order.status.toLowerCase() === 'pending' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4 flex items-start gap-3 text-orange-800 mx-4 shadow-sm">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <span className="font-semibold block mb-1">Received outside business hours</span>
                            Processing will begin {new Date(order.expected_processing_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.
                        </div>
                    </div>
                )}

                {order.estimated_ready_time && ['confirmed', 'processing', 'packed'].includes(order.status.toLowerCase()) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 text-center text-blue-800">
                        <Clock size={16} className="inline mr-2 mb-1" />
                        <span className="font-medium text-sm">
                            {order.delivery_mode === 'pickup' ? "Estimated Pickup Ready Time:" : "Estimated Ready Time:"}
                        </span>
                        <span className="font-bold ml-2 text-lg block sm:inline mt-1 sm:mt-0">
                            {new Date(order.estimated_ready_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                )}

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
                        <a href={`tel:${order.retailer_phone}`} className={styles.retailerDetail + " text-blue-600 hover:underline"}>
                            <Phone size={14} /> {order.retailer_phone}
                        </a>
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
                                    <p className={styles.itemMeta}>
                                        ₹{item.product_price} × {item.quantity}
                                        {item.returned_quantity && item.returned_quantity > 0 ? (
                                            <span className="text-red-500 font-bold ml-2 text-[10px] uppercase">
                                                ({item.returned_quantity} Returned)
                                            </span>
                                        ) : null}
                                    </p>
                                </div>
                                <div className={styles.itemPrice}>
                                    {item.returned_quantity && item.returned_quantity > 0 ? (
                                        <div className="flex flex-col items-end">
                                            <span className="line-through text-gray-400 text-xs">₹{item.total_price}</span>
                                            <span className="text-green-600 font-bold">₹{(parseFloat(item.product_price) * (item.net_quantity || 0)).toFixed(0)}</span>
                                        </div>
                                    ) : (
                                        `₹${item.total_price}`
                                    )}
                                </div>
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
                            <span>{parseFloat(order.refund_amount || '0') > 0 ? 'Original Total' : 'Total Amount'}</span>
                            <span className={parseFloat(order.refund_amount || '0') > 0 ? 'line-through text-gray-400' : ''}>₹{order.total_amount}</span>
                        </div>
                        {parseFloat(order.refund_amount || '0') > 0 && (
                            <>
                                <div className={styles.summaryRow}>
                                    <span className="text-red-600 font-bold">Refund Amount</span>
                                    <span className="text-red-600 font-bold">-₹{order.refund_amount}</span>
                                </div>
                                <div className={styles.totalRow + " border-t-2 border-gray-200 pt-2 mt-2"}>
                                    <span className="text-green-700">Net Payable</span>
                                    <span className="text-green-700 text-xl font-black">₹{order.net_amount}</span>
                                </div>
                            </>
                        )}
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

                {(() => {
                    const mode = (order.payment_mode || '').toLowerCase();
                    const isCredit = mode === 'credit' || mode === 'khata' || Number(order.credit_amount || 0) > 0;
                    const limit = order.credit_limit == null ? null : Number(order.credit_limit);
                    const used = order.current_balance == null ? null : Number(order.current_balance);
                    if (!isCredit || limit == null || used == null || !(limit > 0)) return null;
                    const remaining = limit - used;
                    return (
                        <section className={styles.section}>
                            <h3 className="font-bold mb-3 text-sm text-gray-500 uppercase">Credit / Khata</h3>
                            <div className="flex flex-col gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Credit limit</span>
                                    <span className="font-medium">₹{limit.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Outstanding</span>
                                    <span className="font-medium">₹{used.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold border-t border-gray-100 pt-2 mt-1">
                                    <span>Remaining credit</span>
                                    <span>₹{remaining.toFixed(2)}</span>
                                </div>
                            </div>
                        </section>
                    );
                })()}

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
                            <div className="flex flex-col p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2 font-semibold">
                                    <CheckCircle size={18} />
                                    <span>You rated this order</span>
                                </div>
                                {order.feedback ? (
                                    <div className="mt-1">
                                        <div className="flex gap-1 mb-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={16}
                                                    className={order.feedback.overall_rating >= star ? 'text-yellow-400' : 'text-gray-300'}
                                                    fill={order.feedback.overall_rating >= star ? '#facc15' : 'none'}
                                                />
                                            ))}
                                        </div>
                                        {order.feedback.comment && (
                                            <p className="text-sm italic text-gray-700 bg-white/50 p-2 rounded">
                                                "{order.feedback.comment}"
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm">Rating submitted successfully.</p>
                                )}
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
                                                className={rating >= star ? 'text-yellow-400' : 'text-gray-300'}
                                                fill={rating >= star ? '#facc15' : 'none'}
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
        <Suspense fallback={<LoadingScreen message="Loading..." />}>
            <OrderDetails />
        </Suspense>
    );
}
