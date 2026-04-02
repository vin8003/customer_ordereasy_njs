import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { ProductCard } from './ProductCard';
import styles from '../retailer/RetailerHome.module.css';
import { useRouter } from 'next/navigation';

import { Product } from '../retailer/page';

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

    useEffect(() => {
        if (inView && !hasFetched) {
            setHasFetched(true);
            const loadProducts = async () => {
                try {
                    setIsLoading(true);
                    const data = await fetchFn();
                    setProducts(data);
                } catch (err) {
                    console.error(`Error fetching products for ${title}:`, err);
                    setError('Failed to load products');
                } finally {
                    setIsLoading(false);
                }
            };

            loadProducts();
        }
    }, [inView, hasFetched, fetchFn, title]);

    // Don't render the section at all if there's no data AND we've already fetched
    if (hasFetched && !isLoading && products.length === 0) {
        return null; // Empty state graceful handling
    }

    return (
        <div ref={ref} className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{title}</h2>
            </div>

            {isLoading ? (
                <div className={styles.productsScroll}>
                    {Array(4).fill(0).map((_, i) => (
                        <div key={i} className={styles.skeletonCard} />
                    ))}
                </div>
            ) : error ? (
                <div className="text-center text-sm text-red-500 py-4">{error}</div>
            ) : (
                <div className={styles.productsScroll}>
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isWishlisted={false} // Would need useWishlist hook to be accurate, defaulting to false
                            onToggleWishlist={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Ideally toggleWishlist from hook
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
