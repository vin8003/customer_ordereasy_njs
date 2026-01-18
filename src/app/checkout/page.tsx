'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './Checkout.module.css';

interface Address {
    id: number;
    address_line1: string;
    city: string;
    state: string;
    pincode: string;
    address_type: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [isLoading, setIsLoading] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);

    // Order Details
    const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [deliveryFee, setDeliveryFee] = useState(50);

    // Rewards
    const [useRewardPoints, setUseRewardPoints] = useState(false);
    const [rewardConfig, setRewardConfig] = useState<any>(null);
    const [userRewardPoints, setUserRewardPoints] = useState(0);
    const [discountFromPoints, setDiscountFromPoints] = useState(0);

    // Ideally pass retailer_id from cart or context
    // For now assuming we are checking out the current active cart
    // We need to fetch cart to display summary or at least total

    useEffect(() => {
        loadAddresses();
        loadCartSummary();
        loadRewardData();
    }, []);

    useEffect(() => {
        calculateDiscount();
    }, [useRewardPoints, rewardConfig, userRewardPoints, cartTotal, deliveryFee]);

    useEffect(() => {
        if (deliveryMode === 'delivery') {
            setDeliveryFee(50);
            if (paymentMethod === 'cash_pickup') setPaymentMethod('cod');
        } else {
            setDeliveryFee(0);
            if (paymentMethod === 'cod') setPaymentMethod('cash_pickup');
        }
    }, [deliveryMode]);

    const loadAddresses = async () => {
        try {
            const data = await apiService.getAddresses();
            setAddresses(data);
            if (data.length > 0) {
                setSelectedAddressId(data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadCartSummary = async () => {
        // Here we might need the retailer ID to fetch the specific cart
        // If we don't have it, we might need a "get active cart" endpoint or logic
        // For MVP, assuming user comes from Cart page which had a retailer context.
        // Let's rely on stored retailer id from localStorage for now (from CartPage logic)
        const storedId = localStorage.getItem('current_retailer_id');
        if (storedId) {
            try {
                const data = await apiService.getCart(storedId);
                setCartTotal(parseFloat(data.total_amount));
            } catch (e) {
                console.error(e);
            }
        }
    };

    const loadRewardData = async () => {
        const storedId = localStorage.getItem('current_retailer_id');
        if (!storedId) return;

        try {
            const [config, loyalty] = await Promise.all([
                apiService.fetchRewardConfiguration(storedId),
                apiService.getCustomerLoyalty(storedId, true)
            ]);
            setRewardConfig(config);
            setUserRewardPoints(parseFloat(loyalty.points || 0));
        } catch (e) {
            console.error("Error fetching reward data:", e);
        }
    };

    const calculateDiscount = () => {
        if (!useRewardPoints || !rewardConfig || userRewardPoints <= 0) {
            setDiscountFromPoints(0);
            return;
        }

        const total = cartTotal + deliveryFee;

        const maxByPercent = (total * parseFloat(rewardConfig.max_reward_usage_percent)) / 100;
        const maxByFlat = parseFloat(rewardConfig.max_reward_usage_flat);
        const maxByBalance = userRewardPoints * parseFloat(rewardConfig.conversion_rate);

        const redeemable = Math.min(
            total,
            maxByPercent,
            maxByFlat,
            maxByBalance
        );

        setDiscountFromPoints(redeemable);
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            alert("Please select a delivery address.");
            return;
        }

        const storedId = localStorage.getItem('current_retailer_id');
        if (!storedId) {
            alert("Retailer session lost. Please go back to cart.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiService.placeOrder({
                retailer_id: storedId,
                address_id: deliveryMode === 'delivery' ? selectedAddressId : null,
                delivery_mode: deliveryMode,
                payment_mode: paymentMethod === 'cod' ? 'cash' : paymentMethod,
                special_instructions: specialInstructions,
                use_reward_points: useRewardPoints
            });

            // Navigate to Order Details
            router.push(`/orders/detail?id=${response.id}`);
        } catch (error) {
            console.error(error);
            alert("Failed to place order. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>Checkout</h1>
                <div className="h-5" />
            </header>

            <main className={styles.main}>
                {/* Delivery Mode Toggle */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Order Type</h2>
                    <div className={styles.toggleGroup}>
                        <button
                            className={`${styles.toggleBtn} ${deliveryMode === 'delivery' ? styles.active : ''}`}
                            onClick={() => setDeliveryMode('delivery')}
                        >
                            Home Delivery
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${deliveryMode === 'pickup' ? styles.active : ''}`}
                            onClick={() => setDeliveryMode('pickup')}
                        >
                            Store Pickup
                        </button>
                    </div>
                </section>

                {/* Address Selection */}
                {deliveryMode === 'delivery' && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Delivery Address</h2>
                        {addresses.length === 0 ? (
                            <div className="text-center p-4 border rounded-lg border-dashed">
                                <p className="mb-2 text-sm text-gray-500">No address found</p>
                                <Button onClick={() => router.push('/addresses/new')}>Add Address</Button>
                            </div>
                        ) : (
                            <div className={styles.addressList}>
                                {addresses.map(addr => (
                                    <div
                                        key={addr.id}
                                        className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.selected : ''}`}
                                        onClick={() => setSelectedAddressId(addr.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 ${selectedAddressId === addr.id ? 'text-primary' : 'text-gray-400'}`}>
                                                {selectedAddressId === addr.id ? <CheckCircle size={20} className="fill-blue-100 text-blue-600" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                                            </div>
                                            <div>
                                                <span className={styles.addressType}>{addr.address_type}</span>
                                                <p className={styles.addressText}>
                                                    {addr.address_line1}, {addr.city}, {addr.pincode}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" className="text-primary text-sm mt-2" onClick={() => router.push('/addresses/new')}>
                                    + Add New Address
                                </Button>
                            </div>
                        )}
                    </section>
                )}

                {/* Payment Method */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Payment Method</h2>
                    <div className={styles.paymentOptions}>
                        <div
                            className={`${styles.paymentCard} ${paymentMethod === (deliveryMode === 'delivery' ? 'cod' : 'cash_pickup') ? styles.selected : ''}`}
                            onClick={() => setPaymentMethod(deliveryMode === 'delivery' ? 'cod' : 'cash_pickup')}
                        >
                            <span className="font-bold">{deliveryMode === 'delivery' ? 'Cash on Delivery' : 'Cash on Pickup'}</span>
                            {paymentMethod === (deliveryMode === 'delivery' ? 'cod' : 'cash_pickup') && <CheckCircle size={18} className="text-blue-600" />}
                        </div>
                        <div
                            className={`${styles.paymentCard} ${paymentMethod === 'upi' ? styles.selected : ''}`}
                            onClick={() => setPaymentMethod('upi')}
                        >
                            <span className="font-bold">UPI / One Click</span>
                            {paymentMethod === 'upi' && <CheckCircle size={18} className="text-blue-600" />}
                        </div>
                    </div>
                </section>

                {/* Special Instructions */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Special Instructions</h2>
                    <textarea
                        className={styles.textarea}
                        placeholder="Any notes for the retailer or delivery partner?"
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                    />
                </section>
                {/* Rewards Section */}
                {rewardConfig && userRewardPoints > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Rewards</h2>
                        <div className={styles.rewardCard}>
                            <div className={styles.rewardContent}>
                                <input
                                    type="checkbox"
                                    id="useRewards"
                                    checked={useRewardPoints}
                                    onChange={(e) => setUseRewardPoints(e.target.checked)}
                                    className={styles.checkbox}
                                />
                                <label htmlFor="useRewards" className={styles.rewardLabel}>
                                    <p className={styles.rewardPointsText}>Use Reward Points</p>
                                    <p className={styles.availablePoints}>Available: {userRewardPoints} pts (₹{userRewardPoints * parseFloat(rewardConfig.conversion_rate)})</p>
                                </label>
                            </div>
                            {useRewardPoints && discountFromPoints > 0 && (
                                <p className={styles.discountApplied}>-₹{discountFromPoints.toFixed(2)} savings applied</p>
                            )}
                        </div>
                    </section>
                )}

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Order Summary</h2>
                    <div className={styles.summaryRow}>
                        <span>Subtotal</span>
                        <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                    {deliveryFee > 0 && (
                        <div className={styles.summaryRow}>
                            <span>Delivery Fee</span>
                            <span>₹{deliveryFee.toFixed(2)}</span>
                        </div>
                    )}
                    {discountFromPoints > 0 && (
                        <div className={`${styles.summaryRow} ${styles.discount}`}>
                            <span>Points Discount</span>
                            <span>-₹{discountFromPoints.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-t border-dashed border-gray-200 mt-2">
                        <span className="font-bold text-lg">Total Amount</span>
                        <span className="font-bold text-xl text-primary">₹{(cartTotal + deliveryFee - discountFromPoints).toFixed(2)}</span>
                    </div>
                </section>
            </main>

            <div className={styles.footer}>
                <Button fullWidth onClick={handlePlaceOrder} isLoading={isLoading}>
                    Place Order (₹{(cartTotal + deliveryFee - discountFromPoints).toFixed(2)})
                </Button>
            </div>
        </div>
    );
}
