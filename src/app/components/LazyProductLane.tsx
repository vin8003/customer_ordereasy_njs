import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { ProductCard } from './ProductCard';
import styles from '../retailer/RetailerHome.module.css';
import { useRouter } from 'next/navigation';

import { Product } from '../retailer/page';
import { processRetailerProductList } from '@/utils/productStock';
import { useWishlist } from '@/hooks/useWishlist';
import { apiService } from '@/services/api';

interface LazyProductLaneProps {
    title: string;
    fetchFn: () => Promise<Product[]>;
    retailerId?: string | number;
    offersDelivery?: boolean;
    offersPickup?: boolean;
}

export default function LazyProductLane({ title, fetchFn, retailerId, offersDelivery, offersPickup }: LazyProductLaneProps) {
    const router = useRouter();
    const { ref, inView } = useInView({
        triggerOnce: true,
        rootMargin: '200px 0px', // Fetch a bit before it actually enters the viewport
    });

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { loadWishlist, toggleWishlist, isWishlisted } = useWishlist();

    useEffect(() => {
        if (inView && !hasFetched) {
            setHasFetched(true);
            if (apiService.isAuthenticated()) loadWishlist();
            const loadProducts = async () => {
                try {
                    setIsLoading(true);
                    const data = await fetchFn();
                    setProducts(processRetailerProductList(data));
                } catch (err) {
                    console.error(`Error fetching products for ${title}:`, err);
                    setError('Failed to load products');
                } finally {
                    setIsLoading(false);
                }
            };

            loadProducts();
        }
    }, [inView, hasFetched, fetchFn, title, loadWishlist]);

    // Don't render the section at all if there's no data AND we've already fetched
    if (hasFetched && !isLoading && products.length === 0 && !error) {
        return null;
    }

    return (
        <div ref={ref} className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{title}</h2>
            </div>

            {isLoading ? (
                <div className={styles.productsScroll}>
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className={`oe-skeleton ${styles.skeletonCard}`} />
                    ))}
                </div>
            ) : error ? (
                <div className="px-4 py-4 text-center text-sm font-medium text-[var(--ink-3)]">{error}</div>
            ) : (
                <div className={styles.productsScroll}>
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
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
            )}
        </div>
    );
}
