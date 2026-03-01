'use client';
import toast from 'react-hot-toast';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, Tag, Award } from 'lucide-react';
import { apiService, getErrorMessage } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import { ProductImage } from '@/app/components/ProductImage';
import { useCartContext } from '@/context/CartContext';
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
                            className={styles.qtyInput}
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
    const { items: contextItems, updateQuantity: updateContextQuantity, removeFromCart: removeFromContextCart } = useCartContext();
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
            if (apiService.isAuthenticated()) {
                loadWishlist();
            }
        } else {
            setIsLoading(false);
        }
    }, [contextItems, loadWishlist]);

    const fetchData = async (rId: string) => {
        setIsLoading(true);
        try {
            if (apiService.isAuthenticated()) {
                const cartData = await apiService.getCart(rId);
                setCartItems((cartData.items || []).map((item: any) => ({
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
                                stock_quantity: product.stock_quantity || 100,
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
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId: number, newQty: number) => {
        const item = cartItems.find(i => i.id === itemId);
        if (!item) return;

        // Use context for update which handles both guest and auth logic (via sync/api)
        // But context updateQuantity expects productId. 
        // For guest, itemId IS productId. For auth, itemId is CartItem ID.
        // Wait, context.updateQuantity takes productId.
        // My CartItem has product_id.

        if (newQty < 1) return;
        if (newQty > item.stock_quantity) {
            toast.error(`Only ${item.stock_quantity} units available for ${item.product_name}`);
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
            <div className={styles.emptyState}>
                <ShoppingBag size={48} />
                <p>Please select a retailer first.</p>
                <Button onClick={() => router.push('/retailers')}>Select Retailer</Button>
            </div>
        );
    }

    if (isLoading) return <LoadingScreen message="Loading Cart..." />;

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
                <div className={styles.totalRow}>
                    <span className="font-bold">Total Amount</span>
                    <span className={`${styles.totalValue} font-bold`}>₹{totalAmount.toFixed(2)}</span>
                </div>
                <Button
                    fullWidth
                    onClick={() => {
                        if (cartItems.length === 0) return;
                        router.push('/checkout');
                    }}
                >
                    Proceed to Checkout
                </Button>
            </div>
        </div>
    );
}
