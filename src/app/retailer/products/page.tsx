'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    minimum_order_quantity: number;
    maximum_order_quantity: number | null;
}

function AllProducts() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const retailerId = searchParams.get('retailerId') as string;
    const categoryId = searchParams.get('categoryId'); // Optional category filter

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
                unit: p.unit || 'Unit',
                minimum_order_quantity: p.minimum_order_quantity || 1,
                maximum_order_quantity: p.maximum_order_quantity
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
                        <div key={product.id} className={styles.productCard} onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}>
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
                                    <button className={styles.addButton} onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (product.stock_quantity < 1) {
                                            alert("Out of Stock");
                                            return;
                                        }
                                        try {
                                            await apiService.addToCart(product.id, 1);
                                            alert("Added to cart!");
                                        } catch (err: any) {
                                            console.error("Add to cart failed", err);
                                            alert(err.response?.data?.error || "Failed to add to cart");
                                        }
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

export default function AllProductsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Products...</div>}>
            <AllProducts />
        </Suspense>
    );
}
