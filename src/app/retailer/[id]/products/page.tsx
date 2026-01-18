'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import { ProductImage } from '@/app/components/ProductImage';
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

    // Use the custom hook
    const { wishlistIds, loadWishlist, toggleWishlist, isWishlisted } = useWishlist();

    useEffect(() => {
        if (retailerId) {
            loadData();
            loadWishlist();
        }
    }, [retailerId, loadWishlist]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const prodData = await apiService.getRetailerProducts(retailerId);
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
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsLoading(false);
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

                    return (
                        <div key={product.id} className={styles.productCard} onClick={() => router.push(`/retailer/${retailerId}/product/${product.id}`)}>
                            <div className={styles.productImage}>
                                {discount > 0 && (
                                    <div className={styles.discountBadge}>{discount}% OFF</div>
                                )}
                                <div className={styles.wishlistIcon} onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Wrap in Number() to be safe, though hook handles it
                                    toggleWishlist(product.id);
                                }}>
                                    <WishlistIcon isWishlisted={isWishlisted(product.id)} />
                                </div>

                                <ProductImage
                                    src={product.image || ''}
                                    alt={product.name}
                                    className="w-full h-full"
                                />
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
