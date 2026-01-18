'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, ShoppingBag } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './Products.module.css';

interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    mrp: number;
    image: string;
    category_name?: string;
    stock_quantity: number;
    unit?: string;
}

export default function AllProductsPage() {
    const params = useParams();
    const router = useRouter();
    const retailerId = params.id as string;

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (retailerId) {
            loadData();
        }
    }, [retailerId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [prodData, wishlistData] = await Promise.all([
                apiService.getRetailerProducts(retailerId),
                apiService.getWishlist().catch(() => ({ results: [] }))
            ]);

            const rawProducts = Array.isArray(prodData) ? prodData : prodData.results || [];

            const processedProducts = rawProducts.map((p: any) => ({
                ...p,
                price: p.discounted_price || p.price,
                mrp: p.original_price || p.price,
                image: p.image || p.image_url || '',
                stock_quantity: p.quantity || 0,
                unit: p.unit || 'Unit'
            }));

            setProducts(processedProducts);

            const ids = new Set<number>((wishlistData.results || wishlistData).map((item: any) => item.product));
            setWishlistIds(ids);

        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleWishlist = async (e: React.MouseEvent, productId: number) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            if (wishlistIds.has(productId)) {
                await apiService.removeFromWishlist(productId);
                setWishlistIds(prev => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
            } else {
                await apiService.addToWishlist(productId);
                setWishlistIds(prev => {
                    const next = new Set(prev);
                    next.add(productId);
                    return next;
                });
            }
        } catch (error) {
            console.error("Wishlist toggle failed", error);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Products...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="ghost" onClick={() => router.back()} className="p-0">
                    <ArrowLeft size={24} />
                </Button>
                <h1>All Products</h1>
            </header>

            <div className={styles.grid}>
                {products.map(product => {
                    const discount = product.mrp > product.price
                        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                        : 0;

                    const isWishlisted = wishlistIds.has(product.id);

                    return (
                        <div key={product.id} className={styles.productCard} onClick={() => router.push(`/retailer/${retailerId}/product/${product.id}`)}>
                            <div className={styles.productImage}>
                                {discount > 0 && (
                                    <div className={styles.discountBadge}>{discount}% OFF</div>
                                )}
                                <div className={styles.wishlistIcon} onClick={(e) => toggleWishlist(e, product.id)}>
                                    <Star size={18} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                                </div>

                                {product.image ? (
                                    <img src={product.image} alt={product.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                        <ShoppingBag size={24} className="text-gray-200" />
                                    </div>
                                )}
                            </div>

                            <div className={styles.productInfo}>
                                <div>
                                    <div className={styles.unit}>{product.unit}</div>
                                    <h3 className={styles.productName}>{product.name}</h3>
                                </div>

                                <div className={styles.priceRow}>
                                    <div className={styles.prices}>
                                        {discount > 0 && <span className={styles.mrp}>₹{product.mrp}</span>}
                                        <span className={styles.price}>₹{product.price}</span>
                                    </div>
                                    <button className={styles.addButton} onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        apiService.addToCart(product.id, 1);
                                    }}>
                                        ADD
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
