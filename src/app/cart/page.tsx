'use client';
import toast from '@/lib/toast';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { ShoppingBag, Trash2, Plus, Minus, ChevronRight, Sparkles, Info, Bike, BadgePercent } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { EmptyState } from '@/app/components/EmptyState';
import PageHeader from '@/app/components/PageHeader';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import { ProductImage } from '@/app/components/ProductImage';
import { useCartContext } from '@/context/CartContext';
import { FrequentlyBoughtTogether } from '@/app/components/FrequentlyBoughtTogether';
import { resolveStockQuantity } from '@/utils/productStock';
import CouponSection, { AppliedCoupon } from '@/app/components/CouponSection';
import styles from './Cart.module.css';

interface CartItem {
    id: number;
    product_id: number;
    product_name: string;
    product_price: number;
    quantity: number;
    product_image?: string;
    stock_quantity: number;
    minimum_order_quantity: number;
    maximum_order_quantity: number | null;
}

const CartItemRow = ({ item, updateQuantity, removeItem, toggleWishlist, isWishlisted }: {
    item: CartItem;
    updateQuantity: (id: number, qty: number) => void;
    removeItem: (id: number) => void;
    toggleWishlist: (id: number) => void;
    isWishlisted: (id: number) => boolean;
}) => {
    const [localQty, setLocalQty] = useState(item.quantity.toString());

    const handleBlur = () => {
        let qty = parseInt(localQty);
        if (isNaN(qty) || qty < 1) {
            setLocalQty(item.quantity.toString()); // Revert
            return;
        }
        if (qty < item.minimum_order_quantity) {
            qty = item.minimum_order_quantity;
            toast.error(`Minimum order quantity is ${item.minimum_order_quantity}`);
        }
        if (item.maximum_order_quantity && qty > item.maximum_order_quantity) {
            qty = item.maximum_order_quantity;
            toast.error(`Maximum order limit is ${item.maximum_order_quantity}`);
        }
        if (qty > item.stock_quantity) {
            qty = item.stock_quantity;
            toast.error(`Maximum order limit is ${item.stock_quantity}`);
        }

        if (qty !== item.quantity) {
            updateQuantity(item.id, qty);
        } else {
            setLocalQty(item.quantity.toString());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    const isMinViolation = item.quantity < item.minimum_order_quantity;
    const isMaxViolation = item.maximum_order_quantity ? item.quantity > item.maximum_order_quantity : false;
    const isStockMaxReached = item.quantity >= item.stock_quantity;

    const atMax = isStockMaxReached || (!!item.maximum_order_quantity && item.quantity >= item.maximum_order_quantity);

    return (
        <div className={styles.cartItem}>
            <div className={styles.itemImage}>
                <ProductImage
                    src={item.product_image || ''}
                    alt={item.product_name}
                    className="w-full h-full"
                />
            </div>
            <div className={styles.itemInfo}>
                <div className={styles.itemTop}>
                    <h3>{item.product_name}</h3>
                    <div className={styles.itemActions}>
                        <button
                            type="button"
                            className={styles.wishlistBtn}
                            onClick={() => toggleWishlist(item.product_id)}
                            aria-label={isWishlisted(item.product_id) ? 'Remove from wishlist' : 'Save to wishlist'}
                        >
                            <WishlistIcon isWishlisted={isWishlisted(item.product_id)} size={17} />
                        </button>
                        <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.product_name}`}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {isMinViolation && (
                    <p className={styles.itemWarning}>
                        Min order qty: {item.minimum_order_quantity}
                    </p>
                )}
                {isMaxViolation && (
                    <p className={styles.itemWarning}>
                        Max order qty: {item.maximum_order_quantity}
                    </p>
                )}

                <div className={styles.controls}>
                    <div className={styles.priceCol}>
                        <span className={styles.price}>₹{(Number(item.product_price) * item.quantity).toFixed(2).replace(/\.00$/, '')}</span>
                        {item.quantity > 1 && <span className={styles.unitPrice}>₹{item.product_price} each</span>}
                    </div>
                    <div className={styles.qtyControls}>
                        <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => {
                                if (item.quantity <= item.minimum_order_quantity) {
                                    updateQuantity(item.id, 0);
                                } else {
                                    updateQuantity(item.id, item.quantity - 1);
                                }
                            }}
                        >
                            <Minus size={15} strokeWidth={2.75} />
                        </button>
                        <input
                            type="text"
                            inputMode="numeric"
                            aria-label="Quantity"
                            value={localQty}
                            onChange={(e) => setLocalQty(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className={styles.qtyInput}
                        />
                        <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className={atMax ? styles.qtyMaxed : ''}
                        >
                            <Plus size={15} strokeWidth={2.75} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function CartPage() {
    const router = useRouter();
    const { handleBack } = useAppNavigation();
    const { items: contextItems, updateQuantity: updateContextQuantity, removeFromCart: removeFromContextCart } = useCartContext();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [retailerId, setRetailerId] = useState<string | null>(null);

    // Use shared wishlist hook
    const { loadWishlist, toggleWishlist, isWishlisted } = useWishlist();

    const [savings, setSavings] = useState(0);
    const [appliedOffers, setAppliedOffers] = useState<{ name?: string; discount?: number }[]>([]);
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [potentialPoints, setPotentialPoints] = useState(0);
    const [fetchError, setFetchError] = useState('');
    const [retailerSettings, setRetailerSettings] = useState<{
        minimumOrderAmount: number;
        deliveryCharge: number;
        freeDeliveryThreshold: number;
    } | null>(null);
    const isGuest = !apiService.isAuthenticated();

    useEffect(() => {
        const storedId = localStorage.getItem('current_retailer_id');
        if (storedId) {
            setRetailerId(storedId);
            fetchData(storedId);
            if (apiService.isAuthenticated()) {
                loadWishlist();
            }
        } else {
            setIsLoading(false);
        }
    }, [contextItems, loadWishlist]);

    const fetchData = async (rId: string) => {
        setIsLoading(true);
        setFetchError('');
        try {
            try {
                const retailerData = await apiService.getRetailerDetails(rId);
                setRetailerSettings({
                    minimumOrderAmount: parseFloat(retailerData.minimum_order_amount || '0'),
                    deliveryCharge: parseFloat(retailerData.delivery_charge || '0'),
                    freeDeliveryThreshold: parseFloat(retailerData.free_delivery_threshold || '0'),
                });
            } catch (e) {
                console.error('Failed to load retailer settings for cart', e);
            }

            if (apiService.isAuthenticated()) {
                const cartData = await apiService.getCart(rId);
                setCartItems((cartData.items || []).map((item: {
                    id: number;
                    product: number;
                    product_name: string;
                    product_price: number;
                    quantity: number;
                    stock_quantity: number;
                    minimum_order_quantity?: number;
                    maximum_order_quantity?: number | null;
                    product_image?: string;
                }) => ({
                    ...item,
                    product_id: item.product,
                    product_name: item.product_name,
                    product_price: item.product_price,
                    stock_quantity: item.stock_quantity,
                    minimum_order_quantity: item.minimum_order_quantity || 1,
                    maximum_order_quantity: item.maximum_order_quantity
                })));
                setTotalAmount(parseFloat(cartData.discounted_total || cartData.total_amount));
                if (cartData.total_savings > 0) {
                    setSavings(cartData.total_savings);
                    setAppliedOffers(cartData.applied_offers || []);
                } else {
                    setSavings(0);
                    setAppliedOffers([]);
                }
                setPotentialPoints(cartData.potential_points || 0);
                setAppliedCoupon(cartData.applied_coupon || null);
                setCouponError(cartData.coupon_error || null);
            } else {
                // Guest Logic
                const productIds = Object.keys(contextItems).map(Number);
                if (productIds.length === 0) {
                    setCartItems([]);
                    setTotalAmount(0);
                    setSavings(0);
                    setAppliedOffers([]);
                    setIsLoading(false);
                    return;
                }

                // Fetch details for guest items
                const itemsDetails = await Promise.all(
                    productIds.map(async (pid) => {
                        try {
                            const product = await apiService.getProductDetail(rId, pid.toString());
                            const qty = contextItems[pid].quantity;

                            // Handle various price field possibilities from backend
                            const price = Number(product.discounted_price) || Number(product.price) || Number(product.original_price) || Number(product.mrp) || 0;

                            return {
                                id: pid, // Use product ID as ID for guest
                                product_id: pid,
                                product_name: product.name,
                                product_price: price, // Use the resolved price
                                quantity: qty,
                                product_image: product.images?.[0]?.image || product.image || '',
                                stock_quantity: resolveStockQuantity(
                                    product.quantity ?? product.stock_quantity,
                                    product.track_inventory
                                ),
                                minimum_order_quantity: product.minimum_order_quantity || 1,
                                maximum_order_quantity: product.maximum_order_quantity
                            } as CartItem;
                        } catch (e) {
                            console.error(`Failed to fetch product ${pid}`, e);
                            return null;
                        }
                    })
                );

                const validItems = itemsDetails.filter(i => i !== null) as CartItem[];
                setCartItems(validItems);

                const total = validItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
                setTotalAmount(total);
                setSavings(0);
                setAppliedOffers([]);
                setPotentialPoints(0);
                setAppliedCoupon(null);
                setCouponError(null);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
            setFetchError('Could not load your cart. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const minOrder = retailerSettings?.minimumOrderAmount ?? 0;
    const belowMinOrder = minOrder > 0 && totalAmount < minOrder;
    const minOrderGap = belowMinOrder ? minOrder - totalAmount : 0;

    const updateQuantity = async (itemId: number, newQty: number) => {
        const item = cartItems.find(i => i.id === itemId);
        if (!item) return;

        // Use context for update which handles both guest and auth logic (via sync/api)
        // But context updateQuantity expects productId. 
        // For guest, itemId IS productId. For auth, itemId is CartItem ID.
        // Wait, context.updateQuantity takes productId.
        // My CartItem has product_id.

        if (newQty < 0) return;
        if (newQty > item.stock_quantity) {
            toast.error(`Maximum order limit is ${item.stock_quantity}`);
            return;
        }
        if (item.maximum_order_quantity && newQty > item.maximum_order_quantity) {
            toast.error(`Maximum order limit is ${item.maximum_order_quantity}`);
            return;
        }

        // Ideally use Context for everything
        await updateContextQuantity(item.product_id, newQty);

        // Refresh local state (fetchData will re-run if context items change? No, contextItems change triggers useEffect)
        // Actually, if contextItems changes, useEffect runs fetchData.
    };

    const removeItem = async (itemId: number) => {
        const item = cartItems.find(i => i.id === itemId);
        if (item) {
            await removeFromContextCart(item.product_id);
        }
    };

    if (!retailerId && !isLoading) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center p-6">
                <EmptyState
                    icon={ShoppingBag}
                    title="Select a store first"
                    description="Pick a nearby retailer to start adding items to your cart."
                    actionLabel="Select Retailer"
                    onAction={() => router.push('/retailers')}
                />
            </div>
        );
    }

    // Full-screen loader only on first load; quantity refreshes keep the cart on screen.
    if (isLoading && cartItems.length === 0) return <LoadingScreen message="Loading Cart..." />;

    if (fetchError) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center p-6">
                <EmptyState
                    icon={ShoppingBag}
                    title="Could not load cart"
                    description={fetchError}
                    actionLabel="Retry"
                    onAction={() => retailerId && fetchData(retailerId)}
                />
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="flex min-h-[80vh] items-center justify-center p-6">
                <EmptyState
                    icon={ShoppingBag}
                    title="Your cart is empty"
                    description="Browse the catalog and add items to check out."
                    actionLabel="Start Shopping"
                    onAction={() => router.push(`/retailer?id=${retailerId}`)}
                />
            </div>
        );
    }

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const itemTotal = totalAmount + Number(savings);
    const ctaLabel = isGuest ? 'Login to checkout' : belowMinOrder ? `Add ₹${minOrderGap.toFixed(0)} more` : 'Proceed to Checkout';
    const handleCheckout = () => {
        if (cartItems.length === 0 || belowMinOrder) return;
        if (isGuest) {
            router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
            return;
        }
        router.push('/checkout');
    };
    const minOrderProgress = minOrder > 0 ? Math.min(100, (totalAmount / minOrder) * 100) : 100;

    return (
        <div className={styles.container}>
            <PageHeader
                title="My Cart"
                subtitle={`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
                onBack={handleBack}
            />

            <div className={styles.layout}>
                <div className={styles.mainCol}>
                    {retailerSettings && belowMinOrder && (
                        <div className={styles.minOrderCard}>
                            <div className={styles.minOrderText}>
                                <Info size={16} />
                                <span>Add <strong>₹{minOrderGap.toFixed(0)}</strong> more to reach the minimum order of ₹{minOrder.toFixed(0)}</span>
                            </div>
                            <div className={styles.progressTrack}>
                                <div className={styles.progressFill} style={{ width: `${minOrderProgress}%` }} />
                            </div>
                        </div>
                    )}

                    <section className={styles.cartList} aria-label="Cart items">
                        {cartItems.map(item => (
                            <CartItemRow
                                key={`${item.id}-${item.quantity}`}
                                item={item}
                                updateQuantity={updateQuantity}
                                removeItem={removeItem}
                                toggleWishlist={toggleWishlist}
                                isWishlisted={isWishlisted}
                            />
                        ))}
                        {retailerId && (
                            <button
                                type="button"
                                className={styles.addMore}
                                onClick={() => router.push(`/retailer?id=${retailerId}`)}
                            >
                                <Plus size={16} /> Add more items
                                <ChevronRight size={16} className="ml-auto" />
                            </button>
                        )}
                    </section>

                    {retailerId && (
                        <CouponSection
                            retailerId={retailerId}
                            appliedCoupon={appliedCoupon}
                            couponError={couponError}
                            onCouponChanged={() => fetchData(retailerId)}
                            disabled={isGuest}
                        />
                    )}

                    {retailerId && (
                        <div className={styles.fbtSidebar}>
                            <FrequentlyBoughtTogether
                                retailerId={retailerId}
                                productIds={cartItems.map(item => item.product_id)}
                            />
                        </div>
                    )}
                </div>

                <aside className={styles.summaryCol}>
                    <section className={styles.billCard} aria-label="Bill details">
                        <h2 className={styles.billTitle}>Bill details</h2>
                        <div className={styles.billRow}>
                            <span>Item total</span>
                            <span>₹{itemTotal.toFixed(2)}</span>
                        </div>
                        {Number(savings) > 0 && (
                            <div className={`${styles.billRow} ${styles.billSaving}`}>
                                <span>Total Savings</span>
                                <span>-₹{Number(savings).toFixed(2)}</span>
                            </div>
                        )}
                        {appliedCoupon && (
                            <div className={`${styles.billRow} ${styles.billCoupon}`}>
                                <span>Coupon ({appliedCoupon.code})</span>
                                <span>
                                    {appliedCoupon.benefit_type === 'credit_points'
                                        ? `+${(appliedCoupon.points ?? appliedCoupon.savings ?? 0)} pts cashback`
                                        : `-₹${Number(appliedCoupon.discount ?? appliedCoupon.savings ?? 0).toFixed(2)}`}
                                </span>
                            </div>
                        )}
                        {retailerSettings && retailerSettings.deliveryCharge > 0 && (
                            <div className={`${styles.billRow} ${styles.billMuted}`}>
                                <span className="inline-flex items-center gap-1.5"><Bike size={14} /> Delivery</span>
                                <span>
                                    from ₹{retailerSettings.deliveryCharge.toFixed(0)}
                                    {retailerSettings.freeDeliveryThreshold > 0
                                        ? ` · free above ₹${retailerSettings.freeDeliveryThreshold.toFixed(0)}`
                                        : ''}
                                </span>
                            </div>
                        )}
                        <div className={styles.billDivider} />
                        <div className={styles.totalRow}>
                            <span>Total Amount</span>
                            <span className={styles.totalValue}>₹{totalAmount.toFixed(2)}</span>
                        </div>

                        {(appliedOffers.length > 0 || potentialPoints > 0) && (
                            <div className={styles.perks}>
                                {appliedOffers.length > 0 && (
                                    <span className={styles.perkGreen}>
                                        <BadgePercent size={14} />
                                        {appliedOffers.length} offer{appliedOffers.length > 1 ? 's' : ''} applied
                                    </span>
                                )}
                                {potentialPoints > 0 && (
                                    <span className={styles.perkBlue}>
                                        <Sparkles size={14} />
                                        Earn up to {potentialPoints} shop points on this order
                                    </span>
                                )}
                            </div>
                        )}
                        {retailerSettings && minOrder > 0 && !belowMinOrder && (
                            <p className={styles.billNote}>Min. order ₹{minOrder.toFixed(0)}</p>
                        )}
                        {isGuest && (
                            <p className={styles.billNote}>
                                You will need to log in to complete checkout. Your cart will be saved.
                            </p>
                        )}
                        <Button
                            fullWidth
                            size="lg"
                            className={styles.desktopCta}
                            disabled={belowMinOrder}
                            onClick={handleCheckout}
                        >
                            {ctaLabel}
                        </Button>
                    </section>
                </aside>
            </div>

            <div className={styles.footer}>
                <div className={styles.footerTotal}>
                    <span className={styles.footerAmount}>₹{totalAmount.toFixed(2)}</span>
                    {Number(savings) > 0 ? (
                        <span className={styles.footerSaving}>Saved ₹{Number(savings).toFixed(0)}</span>
                    ) : (
                        <span className={styles.footerLabel}>Total</span>
                    )}
                </div>
                <Button
                    size="lg"
                    className={styles.footerCta}
                    disabled={belowMinOrder}
                    onClick={handleCheckout}
                >
                    {ctaLabel}
                    {!belowMinOrder && <ChevronRight size={18} />}
                </Button>
            </div>
        </div>
    );
}
