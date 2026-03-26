'use client';
import toast from 'react-hot-toast';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { apiService, getErrorMessage } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './Checkout.module.css';
import PhoneVerification from '@/app/components/auth/PhoneVerification';

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
    const [offerSavings, setOfferSavings] = useState(0);
    const [hasActiveOffers, setHasActiveOffers] = useState(false);

    // Order Details
    const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [deliveryFee, setDeliveryFee] = useState(0); // Initialize with 0, will be set dynamically

    // Retailer Settings
    const [retailerSettings, setRetailerSettings] = useState<{
        deliveryCharge: number;
        freeDeliveryThreshold: number;
        minimumOrderAmount: number;
        isCurrentlyOpen?: boolean;
        nextOpenTime?: string;
    } | null>(null);

    // Rewards
    const [useRewardPoints, setUseRewardPoints] = useState(false);
    const [rewardConfig, setRewardConfig] = useState<any>(null);
    const [userRewardPoints, setUserRewardPoints] = useState(0);
    const [discountFromPoints, setDiscountFromPoints] = useState(0);

    // Verification State
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [userPhone, setUserPhone] = useState('');
    const [showVerification, setShowVerification] = useState(false);

    // Ideally pass retailer_id from cart or context
    // For now assuming we are checking out the current active cart
    // We need to fetch cart to display summary or at least total

    const [cartItems, setCartItems] = useState<any[]>([]);

    useEffect(() => {
        const checkAuth = () => {
            if (!apiService.isAuthenticated()) {
                const currentPath = window.location.pathname;
                router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
                return false;
            }
            return true;
        };

        if (checkAuth()) {
            loadData();
        }
    }, []);

    useEffect(() => {
        calculateDiscount();
    }, [useRewardPoints, rewardConfig, userRewardPoints, cartTotal, deliveryFee]);

    useEffect(() => {
        calculateDeliveryFee();
    }, [deliveryMode, retailerSettings, cartTotal]);

    const loadData = async () => {
        await Promise.all([
            loadAddresses(),
            loadCartSummary(),
            loadRewardData(),
            checkUserVerification(),
            loadRetailerSettings()
        ]);
    };

    const loadRetailerSettings = async () => {
        const storedId = localStorage.getItem('current_retailer_id');
        if (storedId) {
            try {
                const data = await apiService.getRetailerDetails(storedId);
                setRetailerSettings({
                    deliveryCharge: parseFloat(data.delivery_charge || '0'),
                    freeDeliveryThreshold: parseFloat(data.free_delivery_threshold || '0'),
                    minimumOrderAmount: parseFloat(data.minimum_order_amount || '0'),
                    isCurrentlyOpen: data.is_currently_open,
                    nextOpenTime: data.next_open_time
                });
            } catch (e) {
                console.error("Failed to load retailer settings", e);
            }
        }
    }

    const calculateDeliveryFee = () => {
        if (deliveryMode !== 'delivery' || !retailerSettings) {
            setDeliveryFee(0);
            if (deliveryMode === 'pickup') {
                if (paymentMethod === 'cod') setPaymentMethod('cash_pickup');
            }
            return;
        }

        if (paymentMethod === 'cash_pickup') setPaymentMethod('cod');

        let fee = retailerSettings.deliveryCharge;

        // Check free delivery threshold
        if (retailerSettings.freeDeliveryThreshold > 0 && cartTotal >= retailerSettings.freeDeliveryThreshold) {
            fee = 0;
        }

        setDeliveryFee(fee);
    };

    const checkUserVerification = async () => {
        try {
            const profile = await apiService.fetchUserProfile();
            // Assuming profile has is_phone_verified. UserProfileSerializer in backend usually has it.
            // If not, we might need to rely on what was returned.
            setIsPhoneVerified(!!profile.is_phone_verified);
            setUserPhone(profile.phone_number || '');
        } catch (e) {
            console.error("Error fetching profile", e);
        }
    };

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
                // Use discounted_total if available, else total_amount
                // However, logic below (calculateDiscount) uses cartTotal to calculate potential points usage.
                // We should track Subtotal and Discount separately to be accurate.
                const subTotal = parseFloat(data.subtotal || data.total_amount);
                const discTotal = parseFloat(data.discounted_total || data.total_amount);
                const offerSavings = parseFloat(data.total_savings || '0');

                setCartTotal(discTotal);
                setOfferSavings(offerSavings);
                setHasActiveOffers(offerSavings > 0);
                setCartItems(data.items || []);
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
        // Verification Check
        if (!isPhoneVerified) {
            setShowVerification(true);
            return;
        }

        if (deliveryMode === 'delivery' && !selectedAddressId) {
            toast.error("Please select a delivery address.");
            return;
        }

        const storedId = localStorage.getItem('current_retailer_id');
        if (!storedId) {
            toast.error("Retailer session lost. Please go back to cart.");
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
            const isUPI = paymentMethod === 'upi';
            router.push(`/orders/detail?id=${response.id}${isUPI ? '&payment=true' : ''}`);
        } catch (error) {
            console.error(error);
            // global error interceptor handles this
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Phone Verification Modal */}
            <PhoneVerification
                isOpen={showVerification}
                onClose={() => setShowVerification(false)}
                initialPhone={userPhone}
                onVerified={() => {
                    setIsPhoneVerified(true);
                    checkUserVerification(); // re-fetch to be sure or just set state
                }}
            />

            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>Checkout</h1>
                <div className="h-5" />
            </header>

            <main className={styles.main}>
                {/* Store Closed Warning */}
                {retailerSettings && retailerSettings.isCurrentlyOpen === false && (
                    <div className="mx-4 mt-4 mb-2 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3 text-orange-800">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <div className="text-sm">
                            <span className="font-semibold block mb-1">Store is currently closed</span>
                            You can still place your order now. It will be scheduled for processing when the store opens next
                            {retailerSettings.nextOpenTime ? ` at ${retailerSettings.nextOpenTime}` : ''}.
                        </div>
                    </div>
                )}

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
                                <Button onClick={() => router.push('/addresses/create')}>Add Address</Button>
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
                                <Button variant="outline" className="text-primary text-sm mt-2" onClick={() => router.push('/addresses/create')}>
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
                    <h2 className={styles.sectionTitle}>Order Items</h2>
                    <div className={styles.itemsList}>
                        {cartItems.map((item: any) => (
                            <div key={item.id || item.product} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                <div className="flex gap-2">
                                    <span className="text-gray-500 font-medium">{item.quantity}x</span>
                                    <span>{item.product_name}</span>
                                </div>
                                <span className="font-medium">₹{(Number(item.product_price) * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Order Summary</h2>
                    <div className={styles.summaryRow}>
                        <span>Subtotal</span>
                        <span>₹{(cartTotal + offerSavings).toFixed(2)}</span>
                    </div>
                    {hasActiveOffers && (
                        <div className={`${styles.summaryRow} text-green-600`}>
                            <span>Offer Discount</span>
                            <span>-₹{offerSavings.toFixed(2)}</span>
                        </div>
                    )}
                    {deliveryMode === 'delivery' && retailerSettings && retailerSettings.freeDeliveryThreshold > 0 && cartTotal < retailerSettings.freeDeliveryThreshold && (
                        <div className="bg-blue-50 text-blue-800 text-sm p-2 rounded mb-2 border border-blue-200 flex justify-between items-center">
                            <span>Add items worth ₹{(retailerSettings.freeDeliveryThreshold - cartTotal).toFixed(0)} more for FREE Delivery!</span>
                            <Button variant="ghost" className="text-blue-700 h-auto py-0 px-2 text-xs hover:bg-blue-100" onClick={() => router.back()}>
                                Add Items
                            </Button>
                        </div>
                    )}
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
