'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Trash2, ArrowLeft, ShoppingCart } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './Wishlist.module.css';

interface WishlistItem {
    id: number;
    product_id: number;
    product_name: string;
    product_price: number;
    product_image?: string;
    retailer_name: string;
}

export default function WishlistPage() {
    const router = useRouter();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getWishlist();
            // Handle pagination or direct list
            const results = Array.isArray(data) ? data : (data.results || []);
            setWishlistItems(results);
        } catch (error) {
            console.error("Failed to fetch wishlist", error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromWishlist = async (productId: number) => {
        try {
            await apiService.removeFromWishlist(productId);
            setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
        } catch (e) {
            console.error(e);
        }
    };

    const moveToCart = async (item: WishlistItem) => {
        try {
            await apiService.addToCart(item.product_id, 1);
            // Optional: remove from wishlist after adding to cart
            // await removeFromWishlist(item.product_id);
            alert("Added to cart!");
        } catch (e) {
            console.error(e);
            alert("Failed to add to cart");
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading Wishlist...</div>;

    if (wishlistItems.length === 0) {
        return (
            <div className={styles.emptyState}>
                <Heart size={48} />
                <p>Your wishlist is empty.</p>
                <Button onClick={() => router.push('/retailers')}>Explore Products</Button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>My Wishlist</h1>
                <div className="h-5" />
            </header>

            <div className={styles.list}>
                {wishlistItems.map(item => (
                    <div key={item.id} className={styles.itemCard}>
                        <div className={styles.imagePlaceholder}>
                            <ShoppingBag size={24} className="text-gray-300" />
                        </div>
                        <div className={styles.info}>
                            <h3>{item.product_name}</h3>
                            <p className={styles.retailer}>{item.retailer_name}</p>
                            <p className={styles.price}>₹{item.product_price}</p>
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.actionBtn} onClick={() => moveToCart(item)}>
                                <ShoppingCart size={20} className="text-green-600" />
                            </button>
                            <button className={styles.actionBtn} onClick={() => removeFromWishlist(item.product_id)}>
                                <Trash2 size={20} className="text-red-500" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
