'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Search, MapPin, ChevronRight, Copy, Star } from 'lucide-react';
import { apiService } from '@/services/api';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import { ProductImage } from '@/app/components/ProductImage';
import { ProductCard } from '@/app/components/ProductCard';
import styles from './RetailerHome.module.css';

interface Category {
    id: number;
    name: string;
    image?: string;
    item_count?: number;
}

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

function RetailerHome() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const retailerId = id as string;

    const [retailer, setRetailer] = useState<any>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
    const [buyAgainProducts, setBuyAgainProducts] = useState<Product[]>([]);
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [referralCode, setReferralCode] = useState('');

    // Use shared wishlist hook
    const { wishlistIds, loadWishlist, toggleWishlist, isWishlisted } = useWishlist();

    useEffect(() => {
        if (retailerId) {
            loadData();
            loadWishlist(); // Load wishlist
        }
    }, [retailerId, loadWishlist]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [retailerData, catData, featData, bestData, againData, recData, userProfile] = await Promise.all([
                apiService.getRetailerDetails(retailerId),
                apiService.getRetailerCategories(retailerId),
                apiService.getFeaturedProducts(retailerId),
                apiService.getBestSellingProducts(retailerId).catch((e) => {
                    console.error("Best selling error:", e);
                    return [];
                }),
                apiService.isAuthenticated() ? apiService.getBuyAgainProducts(retailerId).catch((e) => {
                    console.error("Buy again error:", e);
                    return [];
                }) : Promise.resolve([]),
                apiService.isAuthenticated() ? apiService.getRecommendedProducts(retailerId).catch((e) => {
                    console.error("Recommended error:", e);
                    return [];
                }) : Promise.resolve([]),
                apiService.fetchUserProfile().catch((e) => {
                    console.error("FETCH USER PROFILE FAILED:", e);
                    return { referral_code: '' };
                })
            ]);

            console.log("RETAILER DATA:", retailerData);
            console.log("FEATURED DATA:", featData); // Debug log
            console.log("BEST DATA:", bestData); // Debug log
            console.log("USER PROFILE:", userProfile);

            setRetailer(retailerData);

            if (typeof window !== 'undefined') {
                localStorage.setItem('current_retailer_id', retailerId);
            }

            setCategories(Array.isArray(catData) ? catData : catData.results || []);

            const processProducts = (data: any) => (Array.isArray(data) ? data : data.results || []).map((p: any) => ({
                ...p,
                price: p.discounted_price || p.price,
                mrp: p.original_price || p.price,
                image: p.image || '',
                stock_quantity: p.quantity || 0,
                unit: p.unit || 'Unit'
            }));

            setFeaturedProducts(processProducts(featData));
            setBestSellingProducts(processProducts(bestData)); // Removed .data || []
            setBuyAgainProducts(processProducts(againData));   // Removed .data || []
            setRecommendedProducts(processProducts(recData));  // Removed .data || []

            if (userProfile && userProfile.referral_code) {
                setReferralCode(userProfile.referral_code);
            }

        } catch (e) {
            console.error("Failed to load retailer data", e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!retailer && isLoading) return <div className="flex justify-center p-8">Loading...</div>;
    if (!retailer) return <div className="p-8 text-center">Retailer not found</div>;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.topBar}>
                    <div className="flex-1">
                        <div className={styles.locationInfo}>
                            <MapPin size={16} className="text-blue-500" />
                            <span className="text-xs text-gray-500 font-medium">Shopping at</span>
                        </div>
                        <div className={styles.shopSelector} onClick={() => router.push('/retailers')}>
                            <h1 className={styles.shopName}>{retailer?.shop_name || 'Loading...'}</h1>
                            <ChevronRight size={16} className="rotate-90 text-gray-500" />
                        </div>
                    </div>
                    <button className={styles.wishlistBtn} onClick={() => router.push('/cart')}>
                        <ShoppingBag size={20} />
                    </button>
                </div>

                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Search for products..."
                        className={styles.searchInput}
                    />
                </div>
            </header>

            <main className={styles.main}>
                {/* Categories */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Explore by Category</h2>
                        <Link href={`/retailer/categories?retailerId=${retailerId}`} className={styles.seeAll}>
                            See All <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div className={styles.categoriesScroll}>
                        {categories.slice(0, 12).map(cat => (
                            <Link href={`/retailer/category?retailerId=${retailerId}&categoryId=${cat.id}`} key={cat.id} className={styles.categoryItem}>
                                <div className={styles.catIcon}>
                                    <ShoppingBag size={24} />
                                </div>
                                <span className={styles.catName}>{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Featured Products */}
                {featuredProducts.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Featured Products</h2>
                        </div>
                        <div className={styles.productsScroll}>
                            {featuredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    isWishlisted={isWishlisted(product.id)}
                                    onToggleWishlist={(e: React.MouseEvent) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleWishlist(product.id);
                                    }}
                                    onAdd={(e: React.MouseEvent) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        apiService.addToCart(product.id, 1);
                                    }}
                                    onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Best Selling Products */}
                {bestSellingProducts.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Best Selling</h2>
                        </div>
                        <div className={styles.productsScroll}>
                            {bestSellingProducts.map(product => (
                                <ProductCard
                                    key={`best-${product.id}`}
                                    product={product}
                                    isWishlisted={isWishlisted(product.id)}
                                    onToggleWishlist={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleWishlist(product.id);
                                    }}
                                    onAdd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        apiService.addToCart(product.id, 1);
                                    }}
                                    onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Buy Again (Only if user logged in) */}
                {buyAgainProducts.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Buy Again</h2>
                            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">Based on your orders</span>
                        </div>
                        <div className={styles.productsScroll}>
                            {buyAgainProducts.map(product => (
                                <ProductCard
                                    key={`again-${product.id}`}
                                    product={product}
                                    isWishlisted={isWishlisted(product.id)}
                                    onToggleWishlist={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleWishlist(product.id);
                                    }}
                                    onAdd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        apiService.addToCart(product.id, 1);
                                    }}
                                    onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Recommended Products */}
                {recommendedProducts.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Recommended for You</h2>
                        </div>
                        <div className={styles.productsScroll}>
                            {recommendedProducts.map(product => (
                                <ProductCard
                                    key={`rec-${product.id}`}
                                    product={product}
                                    isWishlisted={isWishlisted(product.id)}
                                    onToggleWishlist={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleWishlist(product.id);
                                    }}
                                    onAdd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        apiService.addToCart(product.id, 1);
                                    }}
                                    onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Referral Banner */}
                <section className={styles.referralBanner}>
                    <div className="flex items-center gap-2 mb-2 justify-center">
                        <Star className="text-yellow-300 fill-yellow-300" size={24} />
                        <h2 className="text-white text-xl font-bold">Refer & Earn</h2>
                    </div>
                    <p className="text-white/80 text-sm mb-4 text-center">Share your code and earn rewards together!</p>

                    {referralCode ? (
                        <div className={styles.codeBox}>
                            <span className={styles.code}>{referralCode}</span>
                            <div className={styles.referralActions}>
                                <button className={styles.actionBtn} onClick={() => navigator.clipboard.writeText(referralCode)}>
                                    <Copy size={14} /> Copy
                                </button>
                            </div>
                        </div>
                    ) : apiService.isAuthenticated() ? (
                        <div className="text-center text-white/80 text-sm">
                            Code unavailable. <button onClick={() => window.location.reload()} className="underline">Retry</button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Link href="/login" className="text-white font-bold underline">Login to view code</Link>
                        </div>
                    )}
                </section>

                <div className={styles.viewAllBtnWrapper}>
                    <button className={styles.viewAllBtn} onClick={() => router.push(`/retailer/products?retailerId=${retailerId}`)}>
                        View All Products
                    </button>
                </div>
            </main>
        </div>
    );
}

export default function RetailerHomePage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
            <RetailerHome />
        </Suspense>
    );
}
