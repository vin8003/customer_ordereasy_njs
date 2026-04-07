'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Trash2, ArrowLeft, Heart } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { ProductImage } from '@/app/components/ProductImage';
import AddToCartButton from '@/app/components/AddToCartButton';
import styles from './Wishlist.module.css';

interface WishlistItem {
    id: number;
    product: number; // Product ID
    product_name: string;
    product_price: number;
    product_image: string;
    retailer_name: string;
    retailer_id: number;
    product_stock?: number;
    minimum_order_quantity?: number;
    maximum_order_quantity?: number | null;
}

export default function WishlistPage() {
    const router = useRouter();
    const { handleBack } = useAppNavigation();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        if (apiService.isAuthenticated()) {
            loadWishlist();
        } else {
            setIsGuest(true);
            setIsLoading(false);
        }
    }, []);

    const loadWishlist = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getWishlist();
            // Handle pagination results if present
            const results = data.results || data;
            setWishlistItems(results);
        } catch (error) {
            console.error("Failed to load wishlist", error);
        } finally {
            setIsLoading(false);
        }
    };



    const removeItem = async (productId: number) => {
        try {
            await apiService.removeFromWishlist(productId);
            setWishlistItems(prev => prev.filter(item => item.product !== productId));
        } catch (error) {
            console.error("Failed to remove from wishlist", error);
        }
    };

    if (isLoading) return <LoadingScreen message="Loading Wishlist..." />;

    if (isGuest) {
        return (
            <div className={styles.emptyState}>
                <Heart size={48} className="text-gray-300" />
                <p>Please login to view your wishlist.</p>
                <div className="flex gap-2">
                    <Button onClick={() => router.push('/login?redirect=/wishlist')}>Login</Button>
                    <Button variant="outline" onClick={() => router.push('/retailers')}>Continue Shopping</Button>
                </div>
            </div>
        );
    }

    if (wishlistItems.length === 0) {
        return (
            <div className={styles.emptyState}>
                <Heart size={48} className="text-gray-300" />
                <p>Your wishlist is empty.</p>
                <Button onClick={() => router.push('/retailers')}>Explore Products</Button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>My Wishlist</h1>
                <div className="h-5" />
            </header>

            <div className={styles.list}>
                {wishlistItems.map(item => (
                    <div key={item.id} className={styles.itemCard}>
                        <div className={styles.imagePlaceholder}>
                            <ProductImage
                                src={item.product_image || ''}
                                alt={item.product_name}
                                className="w-full h-full"
                            />
                        </div>
                        <div className={styles.info}>
                            <h3>{item.product_name}</h3>
                            <p className={styles.retailer}>{item.retailer_name}</p>
                            <p className={styles.price}>₹{item.product_price}</p>
                        </div>
                        <div className={styles.actions}>
                            <div onClick={() => { }} title="Add to Cart">
                                <AddToCartButton
                                    productId={item.product}
                                    minimumOrderQuantity={item.minimum_order_quantity}
                                    maximumOrderQuantity={item.maximum_order_quantity}
                                    retailerId={String(item.retailer_id)}
                                    retailerName={item.retailer_name}
                                />
                            </div>
                            <button className={styles.actionBtn} onClick={() => removeItem(item.product)} title="Remove">
                                <Trash2 size={18} className="text-red-500" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
