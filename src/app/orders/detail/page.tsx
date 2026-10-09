'use client';
import toast from '@/lib/toast';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Phone, Package, Clock, CheckCircle, XCircle, AlertCircle, Star, MessageCircle, Loader2, Store, Bike, Wallet, StickyNote, Sparkles, Check, CreditCard } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import PageHeader from '@/app/components/PageHeader';
import { ProductImage } from '@/app/components/ProductImage';
import UpiPaymentPanel from '@/app/components/UpiPaymentPanel';
import { getOrderTaxSummary } from '@/lib/orderTaxSummary';
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
    taxable_amount?: string;
    tax_amount?: string;
    total_amount: string;
    refund_amount?: string;
    net_amount?: string;
    delivery_mode: string;
    payment_mode: string;
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
    coupon_code?: string | null;
    points_earned?: number;
}

function OrderDetails() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const autoOpenUpi = searchParams.get('payment') === 'true';

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
                return { label: 'Pending Payment', color: 'text-[var(--amber-700)]', icon: <Clock size={16} /> };
            case 'pending_verification': 
                return { label: 'Pending Verification', color: 'text-[var(--brand-600)]', icon: <Loader2 size={16} className="animate-spin" /> };
            case 'verified': 
                return { label: 'Verified', color: 'text-[var(--fresh-700)]', icon: <CheckCircle size={16} /> };
            case 'failed': 
                return { label: 'Verification Failed', color: 'text-[var(--rose-600)]', icon: <XCircle size={16} /> };
            default: 
                return { label: status, color: 'text-[var(--ink-3)]', icon: <Clock size={16} /> };
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return { color: styles.toneWarn, icon: <Clock size={22} /> };
            case 'waiting_for_customer_approval': return { color: styles.toneWarn, icon: <AlertCircle size={22} /> };
            case 'confirmed': return { color: styles.toneInfo, icon: <Package size={22} /> };
            case 'delivered': return { color: styles.toneSuccess, icon: <CheckCircle size={22} /> };
            case 'cancelled': return { color: styles.toneDanger, icon: <XCircle size={22} /> };
            default: return { color: styles.toneInfo, icon: <Package size={22} /> };
        }
    };

    if (isLoading) return <LoadingScreen message="Loading..." />;
    if (!order) {
        return (
            <div className={styles.notFound}>
                <Package size={36} strokeWidth={1.5} />
                <h1>Order not found</h1>
                <Button variant="outline" onClick={() => router.push('/orders')}>Back to orders</Button>
            </div>
        );
    }

    const statusInfo = getStatusInfo(order.status);
    const taxSummary = getOrderTaxSummary(order);

    const statusKey = order.status.toLowerCase();
    const trackerSteps = [
        { key: 'placed', label: 'Placed', match: ['pending', 'waiting_for_customer_approval'] },
        { key: 'confirmed', label: 'Confirmed', match: ['confirmed', 'processing'] },
        { key: 'packed', label: 'Packed', match: ['packed'] },
        ...(order.delivery_mode === 'pickup' ? [] : [{ key: 'otw', label: 'On the way', match: ['out_for_delivery'] }]),
        { key: 'delivered', label: order.delivery_mode === 'pickup' ? 'Picked up' : 'Delivered', match: ['delivered'] },
    ];
    const currentStep = trackerSteps.findIndex((step) => step.match.includes(statusKey));
    const showTracker = currentStep >= 0;

    return (
        <div className={styles.container}>
            <PageHeader
                title={`Order #${order.order_number}`}
                subtitle={new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                onBack={() => router.push('/orders')}
                right={
                    <button
                        type="button"
                        className={styles.chatBtn}
                        onClick={() => router.push(`/orders/chat?id=${order.id}`)}
                    >
                        <MessageCircle size={16} />
                        Chat
                    </button>
                }
            />

            <main className={styles.main}>
                <div className={`${styles.statusBanner} ${statusInfo.color}`}>
                    <div className={styles.statusTop}>
                        <span className={styles.statusIcon}>{statusInfo.icon}</span>
                        <div className="min-w-0">
                            <div className={styles.statusLabel}>Order {order.status.replace(/_/g, ' ')}</div>
                            {statusKey === 'cancelled' && order.cancelled_by && (
                                <div className={styles.statusSub}>By {order.cancelled_by}</div>
                            )}
                            <div className={styles.statusValue}>#{order.order_number} · {order.retailer_name}</div>
                        </div>
                    </div>
                    {showTracker && (
                        <ol className={styles.tracker} aria-label="Order progress">
                            {trackerSteps.map((step, idx) => (
                                <li
                                    key={step.key}
                                    className={`${styles.trackerStep} ${idx <= currentStep ? styles.trackerDone : ''} ${idx === currentStep ? styles.trackerCurrent : ''}`}
                                    aria-current={idx === currentStep ? 'step' : undefined}
                                >
                                    <span className={styles.trackerDot}>
                                        {idx < currentStep || statusKey === 'delivered' ? <Check size={12} strokeWidth={3} /> : null}
                                    </span>
                                    <span className={styles.trackerLabel}>{step.label}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                {/* UPI Payment Section */}
                {order.payment_mode === 'upi' && order.status !== 'cancelled' && (
                    <div className={styles.upipaymentSection}>
                        <div className={styles.upipaymentHeader}>
                            <div className={styles.upipaymentIcon}>
                                <CreditCard size={20} />
                            </div>
                            <h3 className={styles.upipaymentTitle}>UPI Payment Details</h3>
                        </div>
                        
                        {(!order.payment_reference_id || isEditingPayment) ? (
                            <>
                                <p className={styles.upipaymentDescription}>
                                    Please complete the payment and provide the transaction ID below.
                                </p>

                                <UpiPaymentPanel
                                    retailerUpiId={order.retailer_upi_id}
                                    retailerName={order.retailer_name}
                                    orderNumber={order.order_number}
                                    netAmount={order.net_amount}
                                    totalAmount={order.total_amount}
                                    retailerUpiQrCode={order.retailer_upi_qr_code}
                                    autoOpen={autoOpenUpi}
                                />

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
                                        <p className={styles.editCount}>
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
                                    <p className={styles.mutedCenter}>
                                        You can edit transaction ID until verification
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className={styles.paymentBox}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className={styles.upiIdLabel}>Submitted Trans. ID</span>
                                            <div className={styles.paymentRef}>{order.payment_reference_id}</div>
                                        </div>
                                        
                                        {!order.is_payment_locked && (order.payment_edit_count || 0) < 3 && (
                                            <button 
                                                onClick={() => {
                                                    setReferenceId(order.payment_reference_id || '');
                                                    setIsEditingPayment(true);
                                                }}
                                                className={styles.editBtn}
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>

                                    <div className={styles.paymentStatusRow}>
                                        <span className={styles.paymentStatusLabel}>Status</span>
                                        <div className={`flex items-center gap-1.5 text-sm font-bold ${getPaymentStatusInfo(order.payment_status || '').color}`}>
                                            {getPaymentStatusInfo(order.payment_status || '').icon}
                                            {getPaymentStatusInfo(order.payment_status || '').label}
                                        </div>
                                    </div>
                                    
                                    {order.payment_status === 'failed' && (
                                        <p className={styles.paymentFailed}>
                                            Verification failed. Please check your transaction ID and edit if incorrect.
                                        </p>
                                    )}
                                </div>
                                
                                {order.is_payment_locked && (
                                    <p className={styles.paymentLocked}>
                                        Payment verified and locked. No further edits allowed.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {order.expected_processing_start && order.status.toLowerCase() === 'pending' && (
                    <div className={styles.noticeWarn}>
                        <AlertCircle size={18} />
                        <div>
                            <strong>Received outside business hours</strong>
                            Processing will begin {new Date(order.expected_processing_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.
                        </div>
                    </div>
                )}

                {order.estimated_ready_time && ['confirmed', 'processing', 'packed'].includes(order.status.toLowerCase()) && (
                    <div className={styles.noticeInfo}>
                        <Clock size={18} />
                        <span className={styles.etaLabel}>
                            {order.delivery_mode === 'pickup' ? "Estimated Pickup Ready Time:" : "Estimated Ready Time:"}
                        </span>
                        <span className={styles.etaValue}>
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
                                className={`flex-1 ${styles.dangerOutline}`}
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
                        <span className={styles.retailerIcon}><Store size={20} /></span>
                        <div className="min-w-0 flex-1">
                            <h2 className={styles.retailerName}>{order.retailer_name}</h2>
                            <div className={styles.retailerDetail}>
                                <MapPin size={13} /> {order.retailer_address}
                            </div>
                        </div>
                        {order.retailer_phone && (
                            <a href={`tel:${order.retailer_phone}`} className={styles.callBtn} aria-label={`Call ${order.retailer_name}`}>
                                <Phone size={17} />
                            </a>
                        )}
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>Items <span>{order.items.length}</span></h3>
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
                                            <span className={styles.returnedTag}>
                                                ({item.returned_quantity} Returned)
                                            </span>
                                        ) : null}
                                    </p>
                                </div>
                                <div className={styles.itemPrice}>
                                    {item.returned_quantity && item.returned_quantity > 0 ? (
                                        <div className={styles.returnedPrice}>
                                            <s>₹{item.total_price}</s>
                                            <span>₹{(parseFloat(item.product_price) * (item.net_quantity || 0)).toFixed(0)}</span>
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
                    <h3 className={styles.sectionHeading}>Bill summary</h3>
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
                        {order.coupon_code && (
                            <div className={styles.summaryRow}>
                                <span>Coupon Applied</span>
                                <span className={styles.couponCode}>
                                    {order.coupon_code}
                                </span>
                            </div>
                        )}
                        {order.points_earned && order.points_earned > 0 ? (
                            <div className={styles.cashbackNote}>
                                <Sparkles size={14} /> <span><strong>+{order.points_earned} Cashback Points</strong> {order.status === 'delivered' ? 'credited' : 'will be credited upon delivery'}!</span>
                            </div>
                        ) : null}
                        {parseFloat(order.discount_from_points) > 0 && (
                            <div className={styles.summaryRow}>
                                <span>Points Redeemed</span>
                                <span className={styles.discount}>-₹{order.discount_from_points}</span>
                            </div>
                        )}
                        {taxSummary && (
                            <>
                                <div className={styles.summaryRow}>
                                    <span>Taxable Amount</span>
                                    <span>₹{taxSummary.taxableAmount}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>GST (included)</span>
                                    <span>₹{taxSummary.taxAmount}</span>
                                </div>
                            </>
                        )}
                        <div className={styles.totalRow}>
                            <span>{parseFloat(order.refund_amount || '0') > 0 ? 'Original Total' : 'Total Amount'}</span>
                            <span className={parseFloat(order.refund_amount || '0') > 0 ? styles.struck : ''}>₹{order.total_amount}</span>
                        </div>
                        {parseFloat(order.refund_amount || '0') > 0 && (
                            <>
                                <div className={styles.summaryRow}>
                                    <span className={styles.refund}>Refund Amount</span>
                                    <span className={styles.refund}>-₹{order.refund_amount}</span>
                                </div>
                                <div className={`${styles.totalRow} ${styles.netRow}`}>
                                    <span>Net Payable</span>
                                    <span>₹{order.net_amount}</span>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>Delivery info</h3>
                    <div className={styles.infoList}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoIcon}><Bike size={16} /></span>
                            <div>
                                <span className={styles.infoLabel}>Method</span>
                                <span className={`${styles.infoValue} capitalize`}>{order.delivery_mode}</span>
                            </div>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoIcon}><Wallet size={16} /></span>
                            <div>
                                <span className={styles.infoLabel}>Payment</span>
                                <span className={`${styles.infoValue} uppercase`}>{order.payment_mode.replace(/_/g, ' ')}</span>
                            </div>
                        </div>
                        {order.delivery_mode === 'delivery' && (
                            <div className={styles.infoRow}>
                                <span className={styles.infoIcon}><MapPin size={16} /></span>
                                <div>
                                    <span className={styles.infoLabel}>Address</span>
                                    <span className={styles.infoValue}>{order.delivery_address_text}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {order.special_instructions && (
                    <section className={styles.section}>
                        <h3 className={styles.sectionHeading}><StickyNote size={14} /> Notes</h3>
                        <div className={styles.instructionsBox}>{order.special_instructions}</div>
                    </section>
                )}

                {/* Cancel Button */}
                {['pending', 'confirmed', 'processing'].includes(order.status.toLowerCase()) && (
                    <div className={styles.actionBlock}>
                        <Button
                            variant="outline"
                            fullWidth
                            className={styles.dangerOutline}
                            onClick={handleCancelOrder}
                            isLoading={isActionLoading}
                        >
                            Cancel Order
                        </Button>
                        <p className={styles.mutedCenter}>
                            Orders can only be cancelled before they are packed or out for delivery.
                        </p>
                    </div>
                )}

                {/* Rating Button */}
                {order.status.toLowerCase() === 'delivered' && (
                    <div className={styles.actionBlock}>
                        {!order.has_customer_feedback ? (
                            <Button
                                variant="primary"
                                fullWidth
                                size="lg"
                                onClick={() => setShowRatingModal(true)}
                            >
                                <Star size={18} fill="currentColor" />
                                Rate Store
                            </Button>
                        ) : (
                            <div className={styles.ratedCard}>
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
                                                    className={order.feedback.overall_rating >= star ? 'text-amber-400' : 'text-[var(--line-strong)]'}
                                                    fill={order.feedback.overall_rating >= star ? '#fbbf24' : 'none'}
                                                />
                                            ))}
                                        </div>
                                        {order.feedback.comment && (
                                            <p className={styles.ratedComment}>
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
                    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgb(11_19_36/0.45)] p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setShowRatingModal(false)}>
                        <div className="w-full max-w-sm overflow-hidden rounded-t-[var(--r-xl)] bg-white pb-[env(safe-area-inset-bottom)] shadow-[var(--sh-lg)] animate-in fade-in slide-in-from-bottom-8 duration-300 sm:rounded-[var(--r-xl)] sm:pb-0" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Rate your order">
                            <div className="px-5 pt-5">
                                <h3 className="text-center text-lg font-extrabold tracking-tight">Rate your order</h3>
                            </div>

                            <div className="px-5 pt-2 pb-5">
                                <p className="mb-5 text-center text-sm text-[var(--ink-3)]">How was your experience with {order.retailer_name}?</p>

                                <div className="flex justify-center gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                            className="rounded-lg p-1 transition-transform hover:scale-110 active:scale-95"
                                        >
                                            <Star
                                                size={34}
                                                className={rating >= star ? 'text-amber-400' : 'text-[var(--line-strong)]'}
                                                fill={rating >= star ? '#fbbf24' : 'none'}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    className="w-full resize-none rounded-xl border border-[var(--line-strong)] p-3 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)]"
                                    placeholder="Add a comment (optional)..."
                                    rows={3}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 border-t border-[var(--line)] px-5 py-4">
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
