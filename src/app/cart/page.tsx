'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './Cart.module.css';

interface CartItem {
    id: number;
    product_id: number;
    product_name: string;
    product_price: number;
    quantity: number;
    product_image?: string;
    stock_quantity: number;
}

export default function CartPage() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    // Ideally, we'd know retailer ID from context or URL, but simplifies for now by fetching user's latest active cart or enforcing retailer selection 
    // Since backend requires retailer_id to fetch specific cart, let's assume we store focused retailer in localStorage or context.
    // For this generic implementation, we might need a way to detect retailer.
    // However, looking at backend, we need retailer_id.
    // We'll try to get it from local storage if previously saved in RetailerHome.
    const [retailerId, setRetailerId] = useState<string | null>(null);

    useEffect(() => {
        // Mock: In a real app, use Context for retailerId
        const storedId = localStorage.getItem('current_retailer_id');
        if (storedId) {
            setRetailerId(storedId);
            fetchCart(storedId);
        } else {
            // If no retailer selected, redirect or show message
            setIsLoading(false);
        }
    }, []);

    const fetchCart = async (rId: string) => {
        setIsLoading(true);
        try {
            const data = await apiService.getCart(rId);
            // Adapt to backend response structure
            setCartItems(data.items || []);
            setTotalAmount(parseFloat(data.total_amount));
        } catch (error) {
            console.error("Failed to fetch cart", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId: number, newQty: number) => {
        if (newQty < 1) return;
        try {
            await apiService.updateCartItem(itemId, newQty);
            // Optimistic update or refetch
            setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQty } : item));
            // Recalculate total locally or refetch
            if (retailerId) fetchCart(retailerId);
        } catch (e) {
            console.error(e);
        }
    };

    const removeItem = async (itemId: number) => {
        try {
            await apiService.removeCartItem(itemId);
            setCartItems(prev => prev.filter(item => item.id !== itemId));
            if (retailerId) fetchCart(retailerId);
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
                <Button onClick={() => router.push(`/retailer/${retailerId}`)}>Start Shopping</Button>
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
                <div className="h-5" /> {/* Spacer */}
            </header>

            <div className={styles.cartList}>
                {cartItems.map(item => (
                    <div key={item.id} className={styles.cartItem}>
                        <div className={styles.itemImage}>
                            <ShoppingBag size={24} className="text-gray-300" />
                        </div>
                        <div className={styles.itemInfo}>
                            <h3>{item.product_name}</h3>
                            <p className={styles.price}>₹{item.product_price}</p>

                            <div className={styles.controls}>
                                <div className={styles.qtyControls}>
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><Minus size={16} /></button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={16} /></button>
                                </div>
                                <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <div className={styles.totalRow}>
                    <span>Total Amount</span>
                    <span className={styles.totalValue}>₹{totalAmount.toFixed(2)}</span>
                </div>
                <Button fullWidth onClick={() => router.push('/checkout')}>
                    Proceed to Checkout
                </Button>
            </div>
        </div>
    );
}

