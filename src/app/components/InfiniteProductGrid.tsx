'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { ProductCard } from '@/app/components/ProductCard';
import { apiService } from '@/services/api';
import { useWishlist } from '@/hooks/useWishlist';
import { useRouter } from 'next/navigation';
import styles from '../retailer/RetailerHome.module.css';
import { Product } from '../retailer/page';

interface InfiniteProductGridProps {
    retailerId: string | number;
    offersDelivery?: boolean;
    offersPickup?: boolean;
}

export default function InfiniteProductGrid({ retailerId, offersDelivery, offersPickup }: InfiniteProductGridProps) {
    const router = useRouter();
    const { ref, inView } = useInView({
        rootMargin: '400px 0px', // Fetch well before it enters viewport
    });

    const { wishlistIds, loadWishlist, toggleWishlist, isWishlisted } = useWishlist();

    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async (pageToFetch: number) => {
        if (!hasMore || isLoading) return;

        try {
            setIsLoading(true);
            setError(null);

            // Only fetch active products without special filters (just pagination)
            const data = await apiService.getRetailerProducts(retailerId, { page: pageToFetch });

            let newProducts: Product[] = [];
            let totalPages = 1;

            if (data && data.results) {
                newProducts = data.results;
                totalPages = Math.ceil(data.count / 20) || 1;
            } else if (Array.isArray(data)) {
                newProducts = data;
                totalPages = 1;
            }

            if (newProducts.length === 0 || pageToFetch >= totalPages) {
                setHasMore(false);
            }

            setProducts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNewProducts];
            });

        } catch (err) {
            console.error('Failed to load products for infinite grid:', err);
            setError('Failed to load more products.');
            setHasMore(false); // Stop trying to fetch if we hit an error
        } finally {
            setIsLoading(false);
        }
    }, [retailerId, hasMore, isLoading]);

    // Initial load
    useEffect(() => {
        if (products.length === 0 && hasMore && !isLoading && !error) {
            fetchProducts(1);
        }
    }, [fetchProducts, products.length, hasMore, isLoading, error]);

    // Load more when scrolling into view
    useEffect(() => {
        if (inView && hasMore && !isLoading && products.length > 0) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchProducts(nextPage);
        }
    }, [inView, hasMore, isLoading, fetchProducts, page, products.length]);

    if (products.length === 0 && !isLoading) {
        return null; // Empty state
    }

    return (
        <div className={`${styles.section} mb-24`}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>All Products</h2>
            </div>

            <div className={styles.productsGrid}>
                {products.map((product) => (
                    <ProductCard
                        key={`infinite-${product.id}`}
                        product={{
                            ...product,
                            price: Number(product.price || (product as any).discounted_price),
                            mrp: Number(product.mrp || (product as any).original_price || product.price),
                            track_inventory: (product as any).track_inventory ?? true,
                            minimum_order_quantity: product.minimum_order_quantity || 1,
                            maximum_order_quantity: product.maximum_order_quantity || null
                        }}
                        isWishlisted={isWishlisted(product.id)}
                        onToggleWishlist={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(product.id);
                        }}
                        onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                        offersDelivery={offersDelivery}
                        offersPickup={offersPickup}
                    />
                ))}
            </div>

            {isLoading && (
                <div className={`${styles.productsGrid} mt-4`}>
                    {Array(4).fill(0).map((_, i) => (
                        <div key={`skeleton-${i}`} className={styles.skeletonCard} />
                    ))}
                </div>
            )}

            {error && (
                <div className="text-center text-sm text-red-500 py-8">{error}</div>
            )}

            {!hasMore && products.length > 0 && (
                <div className="text-center text-sm text-gray-400 py-12">
                    — End of catalog —
                </div>
            )}

            {/* Invisible trigger element */}
            {hasMore && !isLoading && !error && (
                <div ref={ref} className="h-20 w-full" />
            )}
        </div>
    );
}
