'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, Tag, Award } from 'lucide-react';
import { apiService, getErrorMessage } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import { ProductImage } from '@/app/components/ProductImage';
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

    // Sync local state with prop only when prop changes and not currently fully focused (handled via onBlur mainly)
    useEffect(() => {
        setLocalQty(item.quantity.toString());
    }, [item.quantity]);

    const handleBlur = () => {
        const qty = parseInt(localQty);
        if (isNaN(qty) || qty < 1) {
            setLocalQty(item.quantity.toString()); // Revert
            return;
        }
        if (qty !== item.quantity) {
            updateQuantity(item.id, qty);
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
                <h3>{item.product_name}</h3>
                <p className={styles.price}>₹{item.product_price}</p>

                {isMinViolation && (
                    <p className="text-xs text-orange-600 font-medium">
                        Min order qty: {item.minimum_order_quantity}
                    </p>
                )}
                {isMaxViolation && (
                    <p className="text-xs text-orange-600 font-medium">
                        Max order qty: {item.maximum_order_quantity}
                    </p>
                )}

                <div className={styles.controls}>
                    <div className={styles.qtyControls}>
                        <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className={item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            <Minus size={16} />
                        </button>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={localQty}
                            onChange={(e) => setLocalQty(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className="w-14 h-8 text-center mx-1 font-semibold bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                        />
                        <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isStockMaxReached}
                            className={isStockMaxReached ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className={styles.wishlistBtn} onClick={() => toggleWishlist(item.product_id)}>
                            <WishlistIcon isWishlisted={isWishlisted(item.product_id)} />
                        </button>
                        <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function CartPage() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [retailerId, setRetailerId] = useState<string | null>(null);

    // Use shared wishlist hook
    const { loadWishlist, toggleWishlist, isWishlisted } = useWishlist();

    const [savings, setSavings] = useState(0);
    const [appliedOffers, setAppliedOffers] = useState<any[]>([]);
    const [potentialPoints, setPotentialPoints] = useState(0);

    useEffect(() => {
        const storedId = localStorage.getItem('current_retailer_id');
        if (storedId) {
            setRetailerId(storedId);
            fetchData(storedId);
            loadWishlist(); // Load wishlist data
        } else {
            setIsLoading(false);
        }
    }, [loadWishlist]);

    const fetchData = async (rId: string) => {
        setIsLoading(true);
        try {
            const cartData = await apiService.getCart(rId);
            setCartItems((cartData.items || []).map((item: any) => ({
                ...item,
                product_id: item.product, // Map backend 'product' (id) to frontend 'product_id'
                product_name: item.product_name,
                product_price: item.product_price,
                stock_quantity: item.stock_quantity,
                minimum_order_quantity: item.minimum_order_quantity || 1,
                maximum_order_quantity: item.maximum_order_quantity
            })));
            setTotalAmount(parseFloat(cartData.discounted_total || cartData.total_amount));
            // You might want to save applied_offers or total_savings to state if you want to display them
            if (cartData.total_savings > 0) {
                // Logic to show savings, maybe update a separate state variable
                setSavings(cartData.total_savings);
                setAppliedOffers(cartData.applied_offers || []);
            } else {
                setSavings(0);
                setAppliedOffers([]);
            }
            setPotentialPoints(cartData.potential_points || 0);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId: number, newQty: number) => {
        const item = cartItems.find(i => i.id === itemId);
        if (!item) return;

        if (newQty < 1) return; // Hard floor is 1

        // Only block if EXCEEDING stock
        if (newQty > item.stock_quantity) {
            alert(`Only ${item.stock_quantity} units available for ${item.product_name}`);
            return;
        }

        try {
            await apiService.updateCartItem(itemId, newQty);
            setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQty } : item));
            if (retailerId) {
                const data = await apiService.getCart(retailerId);
                setTotalAmount(parseFloat(data.discounted_total || data.total_amount));
                setSavings(parseFloat(data.total_savings || 0));
                setAppliedOffers(data.applied_offers || []);
                setPotentialPoints(data.potential_points || 0);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const removeItem = async (itemId: number) => {
        try {
            await apiService.removeCartItem(itemId);
            setCartItems(prev => prev.filter(item => item.id !== itemId));
            if (retailerId) {
                const data = await apiService.getCart(retailerId);
                setTotalAmount(parseFloat(data.discounted_total || data.total_amount));
                setSavings(parseFloat(data.total_savings || 0));
                setAppliedOffers(data.applied_offers || []);
                setPotentialPoints(data.potential_points || 0);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (!retailerId && !isLoading) {
        return (
            <div className={styles.emptyState}>
                <ShoppingBag size={48} />
                <p>Please select a retailer first.</p>
                <Button onClick={() => router.push('/retailers')}>Select Retailer</Button>
            </div>
        );
    }

    if (isLoading) return <div className="p-8 text-center">Loading Cart...</div>;

    if (cartItems.length === 0) {
        return (
            <div className={styles.emptyState}>
                <ShoppingBag size={48} />
                <p>Your cart is empty.</p>
                <Button onClick={() => router.push(`/retailer?id=${retailerId}`)}>Start Shopping</Button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>My Cart</h1>
                <div className="h-5" />
            </header>

            <div className={styles.cartList}>
                {cartItems.map(item => (
                    <CartItemRow
                        key={item.id}
                        item={item}
                        updateQuantity={updateQuantity}
                        removeItem={removeItem}
                        toggleWishlist={toggleWishlist}
                        isWishlisted={isWishlisted}
                    />
                ))}
            </div>

            <div className={styles.footer}>
                <div className={styles.totalRow}>
                    <span>Subtotal</span>
                    <span className={styles.totalValue}>₹{(totalAmount + Number(savings)).toFixed(2)}</span>
                </div>
                {Number(savings) > 0 && (
                    <div className="flex justify-between items-center text-green-600 font-medium py-2">
                        <span>Savings</span>
                        <span>-₹{Number(savings).toFixed(2)}</span>
                    </div>
                )}
                {appliedOffers.length > 0 && (
                    <div className="space-y-1 py-2 text-sm border-b border-gray-100">
                        {appliedOffers.map((offer, idx) => (
                            <div key={idx} className="flex justify-between items-center text-gray-600">
                                <span className="flex items-center gap-1.5">
                                    <Tag size={14} className="text-green-600" />
                                    <span>{offer.name}</span>
                                </span>
                                {offer.benefit_type === 'credit_points' ? (
                                    <span className="text-amber-600 font-medium text-xs">+{Number(offer.savings)} pts</span>
                                ) : (
                                    <span className="text-green-600 font-medium">-₹{Number(offer.savings).toFixed(2)}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {/* Potential Cashback Points Summary */}
                {Number(potentialPoints) > 0 && (
                    <div className="flex justify-between items-center py-2 mt-1 text-amber-700 bg-amber-50/50 rounded px-2 -mx-2">
                        <span className="flex items-center gap-1.5 font-medium text-sm">
                            <Award size={16} />
                            Points to Earn
                        </span>
                        <span className="font-bold">+{potentialPoints}</span>
                    </div>
                )}
                <div className={styles.totalRow}>
                    <span className="font-bold">Total Amount</span>
                    <span className={`${styles.totalValue} font-bold`}>₹{totalAmount.toFixed(2)}</span>
                </div>
                <Button
                    fullWidth
                    onClick={() => {
                        const hasErrors = cartItems.some(item =>
                            item.quantity < item.minimum_order_quantity ||
                            (item.maximum_order_quantity && item.quantity > item.maximum_order_quantity) ||
                            item.quantity > item.stock_quantity
                        );

                        if (hasErrors) {
                            alert("Please fix the errors in your cart before checking out.");
                            return;
                        }
                        router.push('/checkout');
                    }}
                >
                    Proceed to Checkout
                </Button>
            </div>
        </div>
    );
}
