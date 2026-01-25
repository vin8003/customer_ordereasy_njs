'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Heart, Share2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './ProductDetail.module.css';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    mrp: number;
    stock_quantity: number;
    image?: string;
    image_url?: string;
    minimum_order_quantity: number;
    maximum_order_quantity: number | null;
}

function ProductDetail() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const retailerId = searchParams.get('retailerId') as string;
    const productId = searchParams.get('productId') as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [isWishlisted, setIsWishlisted] = useState(false);

    useEffect(() => {
        if (retailerId && productId) {
            loadProduct();
        }
    }, [retailerId, productId]);

    const loadProduct = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getProductDetail(retailerId, productId);
            setProduct({
                ...data,
                minimum_order_quantity: data.minimum_order_quantity || 1,
                maximum_order_quantity: data.maximum_order_quantity
            });
            // Set initial quantity to minimum order quantity
            setQuantity(data.minimum_order_quantity || 1);
            // Check wishlist status if possible, or just default to false
        } catch (error) {
            console.error("Failed to load product", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!product) return;
        try {
            await apiService.addToCart(product.id, quantity);
            alert("Added to cart!");
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || "Failed to add to cart");
        }
    };

    const toggleWishlist = async () => {
        if (!product) return;
        try {
            if (isWishlisted) {
                await apiService.removeFromWishlist(product.id);
            } else {
                await apiService.addToWishlist(product.id);
            }
            setIsWishlisted(!isWishlisted);
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!product) return <div className="p-8 text-center">Product not found.</div>;

    const discount = product.mrp > product.price
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : 0;

    const isMinReached = quantity <= 1; // Allow down to 1
    const isMaxBlocked = quantity >= product.stock_quantity; // Only block on stock


    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={toggleWishlist}>
                        <Heart size={20} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                    </Button>
                    <Button variant="outline">
                        <Share2 size={20} />
                    </Button>
                </div>
            </header>

            <div className={styles.imageSection}>
                {product.image || product.image_url ? (
                    <div className={styles.productImageWrapper}>
                        <img
                            src={product.image || product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                        />
                    </div>
                ) : (
                    <div className={styles.imagePlaceholder}>
                        <ShoppingBag size={64} className="text-gray-300" />
                    </div>
                )}
            </div>

            <div className={styles.details}>
                <h1 className={styles.title}>{product.name}</h1>

                <div className={styles.priceBlock}>
                    <span className={styles.price}>₹{product.price}</span>
                    {product.mrp > product.price && (
                        <>
                            <span className={styles.mrp}>₹{product.mrp}</span>
                            <span className={styles.discount}>{discount}% OFF</span>
                        </>
                    )}
                </div>

                <div className={styles.divider} />

                <h2 className={styles.sectionTitle}>Product Details</h2>
                <p className={styles.description}>
                    {product.description || "No description available for this product."}
                </p>

                {/* Show MOQ info if applicable */}
                {product.minimum_order_quantity > 1 && (
                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                        Minimum order quantity: {product.minimum_order_quantity} {product.unit || 'units'}
                    </div>
                )}

                <div className={styles.divider} />

                {/* Optional: Similar Products or Reviews could go here */}
            </div>

            <div className={styles.footer}>
                <div className={styles.qtyControl}>
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={isMinReached}
                        className={isMinReached ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                        <Minus size={18} />
                    </button>
                    <span>{quantity}</span>
                    <button
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        disabled={isMaxBlocked}
                        className={isMaxBlocked ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <Button fullWidth onClick={handleAddToCart} disabled={product.stock_quantity === 0}>
                    {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
            </div>
        </div>
    );
}

export default function ProductDetailPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading details...</div>}>
            <ProductDetail />
        </Suspense>
    );
}
