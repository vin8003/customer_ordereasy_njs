'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import { ProductCard } from '@/app/components/ProductCard';
import { useWishlist } from '@/hooks/useWishlist';
import styles from './FrequentlyBoughtTogether.module.css';

interface RawProduct {
    id: number;
    name: string;
    discounted_price?: number;
    price: number;
    original_price?: number;
    image?: string;
    image_url?: string;
    quantity?: number;
    track_inventory?: boolean;
    unit?: string;
    minimum_order_quantity?: number;
    maximum_order_quantity?: number | null;
}

interface FrequentlyBoughtTogetherProps {
    retailerId: string;
    productIds: number[];
    offersDelivery?: boolean;
    offersPickup?: boolean;
}

function mapProduct(p: RawProduct) {
    return {
        id: p.id,
        name: p.name,
        price: Number(p.discounted_price) || Number(p.price),
        mrp: Number(p.original_price) || Number(p.price),
        image: p.image || p.image_url || '',
        stock_quantity: p.quantity || 0,
        track_inventory: p.track_inventory ?? true,
        unit: p.unit || 'Unit',
        minimum_order_quantity: p.minimum_order_quantity || 1,
        maximum_order_quantity: p.maximum_order_quantity,
    };
}

export function FrequentlyBoughtTogether({
    retailerId,
    productIds,
    offersDelivery,
    offersPickup,
}: FrequentlyBoughtTogetherProps) {
    const router = useRouter();
    const { isWishlisted, toggleWishlist, loadWishlist } = useWishlist();
    const [products, setProducts] = useState<ReturnType<typeof mapProduct>[]>([]);
    const seedKey = useMemo(
        () => [...productIds].filter(Boolean).sort((a, b) => a - b).join(','),
        [productIds]
    );

    useEffect(() => {
        loadWishlist();
    }, [loadWishlist]);

    useEffect(() => {
        if (!retailerId || !seedKey) {
            setProducts([]);
            return;
        }
        let cancelled = false;
        const ids = seedKey.split(',').map(Number);
        apiService.getFrequentlyBoughtTogether(retailerId, ids)
            .then((data) => {
                if (cancelled) return;
                const rows = Array.isArray(data) ? data : [];
                setProducts(rows.map(mapProduct));
            })
            .catch((err) => {
                console.error('Failed to load frequently bought together', err);
                if (!cancelled) setProducts([]);
            });
        return () => {
            cancelled = true;
        };
    }, [retailerId, seedKey]);

    if (products.length === 0) return null;

    return (
        <section className={styles.lane} aria-label="Frequently bought together">
            <h2 className={styles.title}>Frequently bought together</h2>
            <div className={styles.scroll}>
                {products.map((product) => (
                    <div key={product.id} className={styles.cardWrap}>
                        <ProductCard
                            product={product}
                            isWishlisted={isWishlisted(product.id)}
                            onToggleWishlist={(e: React.MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleWishlist(product.id);
                            }}
                            onClick={() => router.push(
                                `/retailer/product?retailerId=${retailerId}&productId=${product.id}`
                            )}
                            offersDelivery={offersDelivery}
                            offersPickup={offersPickup}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
