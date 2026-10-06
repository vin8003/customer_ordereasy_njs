'use client';
import toast from '@/lib/toast';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Clock, Bike, Store, MapPin, Plus, Wallet, Smartphone, Banknote, MessageSquareText, Gem, ShoppingBag, Ban, ShieldCheck, Sparkles } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import PageHeader from '@/app/components/PageHeader';
import styles from './Checkout.module.css';
import PhoneVerification from '@/app/components/auth/PhoneVerification';
import { hasValidAddressCoordinates, parseCoordinate } from '@/utils/addressLocation';
import { buildPlaceOrderPayload } from '@/utils/placeOrder';
import CouponSection, { AppliedCoupon } from '@/app/components/CouponSection';

interface Address {
    id: number;
    address_line1: string;
    city: string;
    state: string;
    pincode: string;
    address_type: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
}

interface RewardConfig {
    conversion_rate: string;
    max_reward_usage_percent: string;
    max_reward_usage_flat: string;
}

interface CheckoutCartItem {
    id?: number;
    product?: number;
    product_name: string;
    product_price: number | string;
    quantity: number;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { handleBack } = useAppNavigation();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [isLoading, setIsLoading] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);
    const [offerSavings, setOfferSavings] = useState(0);
    const [hasActiveOffers, setHasActiveOffers] = useState(false);
    const [retailerId, setRetailerId] = useState<string | null>(null);
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);

    // Order Details
    const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [deliveryFee, setDeliveryFee] = useState(0); // Initialize with 0, will be set dynamically

    // Retailer Settings
    const [retailerSettings, setRetailerSettings] = useState<{
        deliveryCharge: number;
        freeDeliveryThreshold: number;
        minimumOrderAmount: number;
        offersDelivery: boolean;
        offersPickup: boolean;
        acceptsCod: boolean;
        acceptsUpi: boolean;
        isCurrentlyOpen?: boolean;
        nextOpenTime?: string;
        retailerUpiId?: string;
        shopName?: string;
    } | null>(null);

    // Rewards
    const [useRewardPoints, setUseRewardPoints] = useState(false);
    const [rewardConfig, setRewardConfig] = useState<RewardConfig | null>(null);
    const [userRewardPoints, setUserRewardPoints] = useState(0);
    const [discountFromPoints, setDiscountFromPoints] = useState(0);

    // Verification State
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [userPhone, setUserPhone] = useState('');
    const [showVerification, setShowVerification] = useState(false);

    // Ideally pass retailer_id from cart or context
    // For now assuming we are checking out the current active cart
    // We need to fetch cart to display summary or at least total

    const [cartItems, setCartItems] = useState<CheckoutCartItem[]>([]);

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
        const storedId = localStorage.getItem('current_retailer_id');
        setRetailerId(storedId);
        await Promise.all([
            loadAddresses(),
            loadCartSummary(storedId),
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
                    offersDelivery: data.offers_delivery,
                    offersPickup: data.offers_pickup,
                    acceptsCod: data.accepts_cod,
                    acceptsUpi: data.accepts_upi,
                    isCurrentlyOpen: data.is_currently_open,
                    nextOpenTime: data.next_open_time,
                    retailerUpiId: data.upi_id || data.retailer_upi_id || '',
                    shopName: data.shop_name || '',
                });

                // Set default delivery mode based on what's offered
                if (data.offers_delivery === false && data.offers_pickup === true) {
                    setDeliveryMode('pickup');
                } else if (data.offers_delivery === true) {
                    setDeliveryMode('delivery');
                }

                // Set default payment method based on what's offered
                if (data.accepts_cod && !data.accepts_upi) {
                    setPaymentMethod(data.offers_delivery !== false ? 'cod' : 'cash_pickup');
                } else if (!data.accepts_cod && data.accepts_upi) {
                    setPaymentMethod('upi');
                }
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
            const verified = !!profile.is_phone_verified;
            setIsPhoneVerified(verified);
            setUserPhone(profile.phone_number || '');
            if (!verified) {
                setShowVerification(true);
            }
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

    const loadCartSummary = async (rId?: string | null) => {
        // Here we might need the retailer ID to fetch the specific cart
        // If we don't have it, we might need a "get active cart" endpoint or logic
        // For MVP, assuming user comes from Cart page which had a retailer context.
        // Let's rely on stored retailer id from localStorage for now (from CartPage logic)
        const storedId = rId || retailerId || localStorage.getItem('current_retailer_id');
        if (storedId) {
            try {
                const data = await apiService.getCart(storedId);
                // Use discounted_total if available, else total_amount
                // However, logic below (calculateDiscount) uses cartTotal to calculate potential points usage.
                // We should track Subtotal and Discount separately to be accurate.
                const discTotal = parseFloat(data.discounted_total || data.total_amount);
                const offerSavings = parseFloat(data.total_savings || '0');

                setCartTotal(discTotal);
                setOfferSavings(offerSavings);
                setHasActiveOffers(offerSavings > 0);
                setCartItems(data.items || []);
                setAppliedCoupon(data.applied_coupon || null);
                setCouponError(data.coupon_error || null);
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
        const conversionRate = parseFloat(rewardConfig.conversion_rate);

        if (!conversionRate || conversionRate <= 0) {
            setDiscountFromPoints(0);
            return;
        }

        const maxByPercent = (total * parseFloat(rewardConfig.max_reward_usage_percent)) / 100;
        const maxByFlat = parseFloat(rewardConfig.max_reward_usage_flat);

        // Maximum discount allowed based on order/flat limits
        const maxDiscountAllowed = Math.min(total, maxByPercent, maxByFlat);

        // Convert the allowed discount into whole points
        const maxPointsAllowed = Math.floor(maxDiscountAllowed / conversionRate);

        // Actual points to redeem must be whole number
        const pointsToRedeem = Math.floor(Math.min(userRewardPoints, maxPointsAllowed));

        const redeemable = pointsToRedeem * conversionRate;

        setDiscountFromPoints(redeemable);
    };

    const payableTotal = cartTotal + deliveryFee - discountFromPoints;
    const minOrder = retailerSettings?.minimumOrderAmount ?? 0;
    const belowMinOrder = minOrder > 0 && cartTotal < minOrder;
    const minOrderGap = belowMinOrder ? minOrder - cartTotal : 0;
    const upiAvailable = retailerSettings?.acceptsUpi !== false && !!retailerSettings?.retailerUpiId;

    useEffect(() => {
        if (!upiAvailable && paymentMethod === 'upi') {
            setPaymentMethod(deliveryMode === 'delivery' ? 'cod' : 'cash_pickup');
        }
    }, [upiAvailable, paymentMethod, deliveryMode]);

    const handlePlaceOrder = async () => {
        // Verification Check
        if (!isPhoneVerified) {
            setShowVerification(true);
            return;
        }

        if (belowMinOrder) {
            toast.error(`Minimum order amount is ₹${minOrder.toFixed(0)}. Add ₹${minOrderGap.toFixed(0)} more.`);
            return;
        }

        if (deliveryMode === 'delivery' && !selectedAddressId) {
            toast.error("Please select a delivery address.");
            return;
        }

        if (deliveryMode === 'delivery' && selectedAddressId) {
            const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
            if (
                selectedAddress &&
                !hasValidAddressCoordinates(
                    parseCoordinate(selectedAddress.latitude),
                    parseCoordinate(selectedAddress.longitude)
                )
            ) {
                toast.error('Please update your delivery address with a map location before ordering.');
                return;
            }
        }

        if (cartItems.length === 0) {
            toast.error('Your cart is empty. Add items before placing an order.');
            return;
        }

        if (paymentMethod === 'upi' && !upiAvailable) {
            toast.error('UPI is not available for this shop. Please choose Cash on Delivery or Pickup.');
            return;
        }

        const storedId = localStorage.getItem('current_retailer_id');
        if (!storedId) {
            toast.error("Retailer session lost. Please go back to cart.");
            return;
        }

        let orderPayload;
        try {
            orderPayload = buildPlaceOrderPayload({
                retailerId: storedId,
                deliveryMode,
                selectedAddressId,
                paymentMethod,
                specialInstructions,
                useRewardPoints,
                couponCode: appliedCoupon?.code || null,
            });
        } catch (payloadError) {
            toast.error(payloadError instanceof Error ? payloadError.message : 'Could not prepare order.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiService.placeOrder(orderPayload);

            // Navigate to Order Details
            const isUPI = paymentMethod === 'upi';
            router.push(`/orders/detail?id=${response.id}${isUPI ? '&payment=true' : ''}`);
        } catch (error: unknown) {
            const responseData =
                error &&
                typeof error === 'object' &&
                'response' in error &&
                error.response &&
                typeof error.response === 'object' &&
                'data' in error.response
                    ? error.response.data
                    : undefined;
            console.error('placeOrder failed', { error, responseData, orderPayload });
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

            <PageHeader title="Checkout" subtitle={retailerSettings?.shopName || undefined} onBack={handleBack} />

            <main className={styles.main}>
                <div className={styles.primaryCol}>
                {/* Store Closed Warning */}
                {retailerSettings && retailerSettings.isCurrentlyOpen === false && (
                    <div className={styles.noticeWarn}>
                        <Clock size={18} />
                        <div>
                            <strong>Store is currently closed</strong>
                            You can still place your order now. It will be scheduled for processing when the store opens next
                            {retailerSettings.nextOpenTime ? ` at ${retailerSettings.nextOpenTime}` : ''}.
                        </div>
                    </div>
                )}

                {/* Delivery Mode Toggle */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><Bike size={16} /></span>
                        Order type
                    </h2>
                    {retailerSettings && !retailerSettings.offersDelivery && !retailerSettings.offersPickup ? (
                        <div className={styles.noticeDanger}>
                            <Ban size={18} />
                            This store is currently not accepting online orders (Delivery & Pickup disabled).
                        </div>
                    ) : (
                        <div className={styles.toggleGroup}>
                            {retailerSettings?.offersDelivery !== false && (
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${deliveryMode === 'delivery' ? styles.active : ''}`}
                                    onClick={() => setDeliveryMode('delivery')}
                                    aria-pressed={deliveryMode === 'delivery'}
                                >
                                    <Bike size={20} />
                                    <span>
                                        <strong>Home Delivery</strong>
                                        <small>To your address</small>
                                    </span>
                                </button>
                            )}
                            {retailerSettings?.offersPickup !== false && (
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${deliveryMode === 'pickup' ? styles.active : ''}`}
                                    onClick={() => setDeliveryMode('pickup')}
                                    aria-pressed={deliveryMode === 'pickup'}
                                >
                                    <Store size={20} />
                                    <span>
                                        <strong>Store Pickup</strong>
                                        <small>No delivery fee</small>
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                    <p className={styles.helpText}>
                        {deliveryMode === 'delivery'
                            ? 'Home delivery to your address. Delivery fee may apply. Orders placed when the shop is closed are processed when it opens.'
                            : 'Collect from the shop. No delivery fee. Pay cash at pickup if you chose Cash on Pickup.'}
                    </p>
                </section>

                {/* Address Selection */}
                {deliveryMode === 'delivery' && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <span className={styles.sectionIcon}><MapPin size={16} /></span>
                            Delivery address
                        </h2>
                        {addresses.length === 0 ? (
                            <div className={styles.emptyAddress}>
                                <p>No saved address yet</p>
                                <Button onClick={() => router.push('/addresses/create')}>
                                    <Plus size={16} /> Add Address
                                </Button>
                            </div>
                        ) : (
                            <div className={styles.addressList}>
                                {addresses.map(addr => {
                                    const hasMapLocation = hasValidAddressCoordinates(
                                        parseCoordinate(addr.latitude),
                                        parseCoordinate(addr.longitude)
                                    );
                                    const isSelected = selectedAddressId === addr.id;
                                    return (
                                    <div
                                        key={addr.id}
                                        role="radio"
                                        aria-checked={isSelected}
                                        tabIndex={0}
                                        className={`${styles.addressCard} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => setSelectedAddressId(addr.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setSelectedAddressId(addr.id);
                                            }
                                        }}
                                    >
                                        <span className={`${styles.radio} ${isSelected ? styles.radioOn : ''}`} />
                                        <div className="min-w-0 flex-1">
                                            <span className={styles.addressType}>{addr.address_type}</span>
                                            <p className={styles.addressText}>
                                                {addr.address_line1}, {addr.city}, {addr.pincode}
                                            </p>
                                            {!hasMapLocation && (
                                                <p className={styles.addressWarn}>
                                                    Map location required —{' '}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/addresses/edit?id=${addr.id}`);
                                                        }}
                                                    >
                                                        update address
                                                    </button>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}
                                <button type="button" className={styles.addAddressBtn} onClick={() => router.push('/addresses/create')}>
                                    <Plus size={16} /> Add New Address
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* Payment Method */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><Wallet size={16} /></span>
                        Payment method
                    </h2>
                    {!retailerSettings?.acceptsCod && !retailerSettings?.acceptsUpi ? (
                        <div className={styles.noticeDanger}>
                            <Ban size={18} />
                            This retailer is not accepting any payments at the moment.
                        </div>
                    ) : (
                        <div className={styles.paymentOptions}>
                            {retailerSettings?.acceptsCod !== false && (
                                <div
                                    role="radio"
                                    tabIndex={0}
                                    aria-checked={['cod', 'cash_pickup'].includes(paymentMethod)}
                                    className={`${styles.paymentCard} ${['cod', 'cash_pickup'].includes(paymentMethod) ? styles.selected : ''}`}
                                    onClick={() => setPaymentMethod(deliveryMode === 'delivery' ? 'cod' : 'cash_pickup')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setPaymentMethod(deliveryMode === 'delivery' ? 'cod' : 'cash_pickup');
                                        }
                                    }}
                                >
                                    <span className={styles.payIcon}><Banknote size={20} /></span>
                                    <span className={styles.payLabel}>
                                        <strong>{deliveryMode === 'delivery' ? 'Cash on Delivery' : 'Cash on Pickup'}</strong>
                                        <small>Pay when you receive your order</small>
                                    </span>
                                    <span className={`${styles.radio} ${['cod', 'cash_pickup'].includes(paymentMethod) ? styles.radioOn : ''}`} />
                                </div>
                            )}
                            {upiAvailable && (
                                <div
                                    role="radio"
                                    tabIndex={0}
                                    aria-checked={paymentMethod === 'upi'}
                                    className={`${styles.paymentCard} ${paymentMethod === 'upi' ? styles.selected : ''}`}
                                    onClick={() => setPaymentMethod('upi')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setPaymentMethod('upi');
                                        }
                                    }}
                                >
                                    <span className={`${styles.payIcon} ${styles.payIconUpi}`}><Smartphone size={20} /></span>
                                    <span className={styles.payLabel}>
                                        <strong>UPI</strong>
                                        <small>Paytm, PhonePe, GPay &amp; more</small>
                                    </span>
                                    <span className={`${styles.radio} ${paymentMethod === 'upi' ? styles.radioOn : ''}`} />
                                </div>
                            )}
                            {retailerSettings?.acceptsUpi !== false && !retailerSettings?.retailerUpiId && (
                                <p className={styles.addressWarn}>
                                    UPI is not available — this shop has not added a UPI ID yet.
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {/* Special Instructions */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><MessageSquareText size={16} /></span>
                        Special instructions
                        <span className={styles.optional}>Optional</span>
                    </h2>
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
                        <h2 className={styles.sectionTitle}>
                            <span className={styles.sectionIcon}><Gem size={16} /></span>
                            Rewards
                        </h2>
                        <label htmlFor="useRewards" className={`${styles.rewardCard} ${useRewardPoints ? styles.rewardOn : ''}`}>
                            <div className={styles.rewardContent}>
                                <input
                                    type="checkbox"
                                    id="useRewards"
                                    checked={useRewardPoints}
                                    onChange={(e) => setUseRewardPoints(e.target.checked)}
                                    className={styles.checkbox}
                                />
                                <span className={styles.rewardLabel}>
                                    <span className={styles.rewardPointsText}>Use Reward Points</span>
                                    <span className={styles.availablePoints}>Available: {userRewardPoints} pts (₹{userRewardPoints * parseFloat(rewardConfig.conversion_rate)})</span>
                                </span>
                            </div>
                            {useRewardPoints && discountFromPoints > 0 && (
                                <p className={styles.discountApplied}>-₹{discountFromPoints.toFixed(2)} savings applied</p>
                            )}
                        </label>
                    </section>
                )}
                </div>

                <div className={styles.secondaryCol}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><ShoppingBag size={16} /></span>
                        Order items
                        <span className={styles.optional}>{cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} items</span>
                    </h2>
                    <div className={styles.itemsList}>
                        {cartItems.map((item) => (
                            <div key={item.id || item.product} className={styles.itemRow}>
                                <span className={styles.itemQty}>{item.quantity}×</span>
                                <span className={styles.itemName}>{item.product_name}</span>
                                <span className={styles.itemPrice}>₹{(Number(item.product_price) * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {retailerId && (
                    <CouponSection
                        retailerId={retailerId}
                        appliedCoupon={appliedCoupon}
                        couponError={couponError}
                        onCouponChanged={() => loadCartSummary(retailerId)}
                    />
                )}

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Order summary</h2>
                    <div className={styles.summaryRow}>
                        <span>Subtotal</span>
                        <span>₹{(cartTotal + offerSavings).toFixed(2)}</span>
                    </div>
                    {hasActiveOffers && (
                        <div className={`${styles.summaryRow} ${styles.discount}`}>
                            <span>Offer Discount</span>
                            <span>-₹{offerSavings.toFixed(2)}</span>
                        </div>
                    )}
                    {appliedCoupon && (
                        <div className={`${styles.summaryRow} ${styles.couponRow}`}>
                            <span>Coupon ({appliedCoupon.code})</span>
                            <span>
                                {appliedCoupon.benefit_type === 'credit_points'
                                    ? `+${(appliedCoupon.points ?? appliedCoupon.savings ?? 0)} pts cashback`
                                    : `-₹${Number(appliedCoupon.discount ?? appliedCoupon.savings ?? 0).toFixed(2)}`}
                            </span>
                        </div>
                    )}
                    {appliedCoupon?.benefit_type === 'credit_points' && (
                        <div className={styles.cashbackNote}>
                            <Sparkles size={14} />
                            <span><strong>+{(appliedCoupon.points ?? appliedCoupon.savings ?? 0)} Cashback Points</strong> will be credited upon delivery!</span>
                        </div>
                    )}
                    {deliveryMode === 'delivery' && retailerSettings && retailerSettings.freeDeliveryThreshold > 0 && cartTotal < retailerSettings.freeDeliveryThreshold && (
                        <div className={styles.freeDeliveryNote}>
                            <span>Add items worth ₹{(retailerSettings.freeDeliveryThreshold - cartTotal).toFixed(0)} more for FREE Delivery!</span>
                            <button type="button" onClick={handleBack}>
                                Add Items
                            </button>
                        </div>
                    )}
                    {minOrder > 0 && (
                        <div className={`${styles.summaryRow} ${belowMinOrder ? styles.warnRow : styles.mutedRow}`}>
                            <span>Min. order</span>
                            <span>
                                ₹{minOrder.toFixed(0)}
                                {belowMinOrder ? ` (add ₹${minOrderGap.toFixed(0)} more)` : ''}
                            </span>
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
                    <div className={styles.totalRow}>
                        <span>Total Amount</span>
                        <span>₹{payableTotal.toFixed(2)}</span>
                    </div>

                    <Button
                        fullWidth
                        size="lg"
                        className={styles.desktopPlace}
                        onClick={handlePlaceOrder}
                        isLoading={isLoading}
                        disabled={belowMinOrder}
                    >
                        {belowMinOrder
                            ? `Add ₹${minOrderGap.toFixed(0)} more to order`
                            : `Place Order (₹${payableTotal.toFixed(2)})`}
                    </Button>
                    <p className={styles.secureNote}><ShieldCheck size={13} /> Your order goes directly to the store</p>
                </section>
                </div>
            </main>

            <div className={styles.footer}>
                <div className={styles.footerTotal}>
                    <span>₹{payableTotal.toFixed(2)}</span>
                    <small>Total payable</small>
                </div>
                <Button
                    size="lg"
                    className={styles.footerBtn}
                    onClick={handlePlaceOrder}
                    isLoading={isLoading}
                    disabled={belowMinOrder}
                >
                    {belowMinOrder
                        ? `Add ₹${minOrderGap.toFixed(0)} more`
                        : 'Place Order'}
                </Button>
            </div>
        </div>
    );
}
