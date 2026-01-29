'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Heart, Share2, Plus, Minus, ShoppingCart, Tag } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './ProductDetail.module.css';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number; // Selling Price
    mrp: number;   // Original Price / MRP
    stock_quantity: number;
    image?: string;
    image_url?: string;
    minimum_order_quantity: number;
    maximum_order_quantity: number | null;
    unit?: string;
    product_group?: string;
    savings?: number;
    discount_percentage?: number;
    offers?: any[]; // flexible for now
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
            console.log("Product Detail API Response:", data); // DEBUG log

            // Strict mapping based on Serializer fields: 
            // original_price -> MRP
            // discounted_price -> Selling Price
            const sellingPrice = Number(data.discounted_price) || Number(data.price);
            const mrp = Number(data.original_price) || Number(data.price); // Fallback to price if original_price missing

            setProduct({
                ...data,
                price: sellingPrice,
                mrp: mrp,
                stock_quantity: data.quantity || 0,
                minimum_order_quantity: data.minimum_order_quantity || 1,
                maximum_order_quantity: data.maximum_order_quantity,
                savings: Number(data.savings),
                discount_percentage: Number(data.discount_percentage),
                offers: data.offers || [] // Assuming offers might be in response, else empty
            });

            setQuantity(data.minimum_order_quantity || 1);

            if (data.id) {
                // Check wishlist status logic here if needed
            }
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
            router.push('/cart');
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

    const handleShare = async () => {
        if (!product) return;
        const shareData = {
            title: product.name,
            text: `Check out ${product.name} on OrderEasy!`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Product link copied to clipboard!");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!product) return <div className="p-8 text-center">Product not found.</div>;

    // Use backend values if available, else calculate
    const hasDiscount = product.mrp > product.price;
    const discountPercent = product.discount_percentage
        ? Math.round(product.discount_percentage)
        : (hasDiscount ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);

    const savingsAmount = product.savings
        ? product.savings
        : (hasDiscount ? (product.mrp - product.price) : 0);

    const isMinReached = quantity <= 1;
    const isMaxBlocked = quantity >= product.stock_quantity;


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
                    <Button variant="outline" onClick={handleShare}>
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
                    {hasDiscount && (
                        <>
                            <span className={styles.mrp}>MRP ₹{product.mrp}</span>
                            {discountPercent > 0 && (
                                <span className={styles.discount}>{discountPercent}% OFF</span>
                            )}
                            {Number(savingsAmount) > 0 && (
                                <span className={styles.savedBadge}>Save ₹{savingsAmount}</span>
                            )}
                        </>
                    )}
                </div>

                {/* Offers Section - ONLY render if real offers exist */}
                {product.offers && product.offers.length > 0 && (
                    <div className={styles.offerSection}>
                        {product.offers.map((offer, idx) => (
                            <div key={idx} className={styles.offerItem}>
                                <Tag size={16} className={styles.offerIcon} />
                                <span>{offer.description || offer.name || "Special Offer"}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.divider} />

                <h2 className={styles.sectionTitle}>Product Details</h2>
                <p className={styles.description}>
                    {product.description || "No description available for this product."}
                </p>

                {product.product_group && (
                    <div className={styles.groupTag}>
                        {product.product_group}
                    </div>
                )}

                {/* Show MOQ info if applicable */}
                {product.minimum_order_quantity > 1 && (
                    <div className={styles.moqBox}>
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

                <div className="flex-1">
                    <Button fullWidth onClick={handleAddToCart} disabled={product.stock_quantity === 0}>
                        {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                </div>
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
