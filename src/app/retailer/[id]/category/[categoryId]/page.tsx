'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Filter } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './CategoryProducts.module.css';

interface Product {
    id: number;
    name: string;
    price: number;
    mrp: number;
    image: string;
    stock_quantity: number;
    unit?: string;
}

export default function CategoryProductsPage() {
    const params = useParams();
    const router = useRouter();
    const retailerId = params.id as string;
    const categoryId = params.categoryId as string;

    const [products, setProducts] = useState<Product[]>([]);
    const [categoryName, setCategoryName] = useState('Products');
    const [isLoading, setIsLoading] = useState(true);
    const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (retailerId && categoryId) {
            loadProducts();
        }
    }, [retailerId, categoryId]);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const [prodData, wishlistData] = await Promise.all([
                apiService.getRetailerProducts(retailerId, { category: categoryId }),
                apiService.getWishlist().catch(() => ({ results: [] }))
            ]);

            const rawProducts = Array.isArray(prodData) ? prodData : prodData.results || [];

            // Map keys
            const mappedProducts = rawProducts.map((p: any) => ({
                ...p,
                price: p.discounted_price || p.price,
                mrp: p.original_price || p.price,
                image: p.image || '',
                stock_quantity: p.quantity || 0,
                unit: p.unit || 'Unit'
            }));

            setProducts(mappedProducts);

            // Wishlist
            const ids = new Set<number>((wishlistData.results || wishlistData).map((item: any) => item.product));
            setWishlistIds(ids);

            // Ideally fetch category name from backend or pass it
            // For now, if we have products, maybe infer or just keep generic
            // Or fetch category detail if endpoint exists. 
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = async (e: React.MouseEvent, productId: number) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await apiService.addToCart(productId, 1);
            // Optional: Toast notification
        } catch (err) {
            console.error(err);
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

    if (isLoading) return <div className="p-8 text-center">Loading Products...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>{categoryName}</h1>
                <Button variant="outline">
                    <Filter size={18} />
                </Button>
            </header>

            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <ShoppingBag size={48} className="mb-4 text-gray-300" />
                    <p>No products found in this category.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {products.map((product) => {
                        const discount = product.mrp > product.price
                            ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                            : 0;
                        const isWishlisted = wishlistIds.has(product.id);

                        return (
                            <div
                                key={product.id}
                                className={styles.card}
                                onClick={() => router.push(`/retailer/${retailerId}/product/${product.id}`)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className={styles.imageWrapper}>
                                    {discount > 0 && (
                                        <div className={styles.discountBadge}>{discount}% OFF</div>
                                    )}
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ShoppingBag size={32} className="text-gray-300" />
                                    )}
                                    <div className={styles.wishlistIcon} onClick={(e) => toggleWishlist(e, product.id)}>
                                        <span className={isWishlisted ? "text-yellow-400 fill-current" : "text-gray-300"}>★</span>
                                    </div>
                                </div>
                                <div className={styles.info}>
                                    <div className="text-xs text-gray-400 mb-1">{product.unit}</div>
                                    <h3 className={styles.name}>{product.name}</h3>
                                    <div className={styles.priceRow}>
                                        <div className="flex flex-col">
                                            {discount > 0 && <span className={styles.mrp}>₹{product.mrp}</span>}
                                            <span className={styles.price}>₹{product.price}</span>
                                        </div>
                                        <button className={styles.addBtn} onClick={(e) => addToCart(e, product.id)}>
                                            ADD
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
