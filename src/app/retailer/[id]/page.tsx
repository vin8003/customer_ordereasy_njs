'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingBag, Search, MapPin, ChevronRight, Copy, Star } from 'lucide-react';
import { apiService } from '@/services/api';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import { ProductImage } from '@/app/components/ProductImage';
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

export default function RetailerHomePage() {
    const { id } = useParams();
    const router = useRouter();
    const retailerId = id as string;

    const [retailer, setRetailer] = useState<any>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
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
            const [retailerData, catData, featData, userProfile] = await Promise.all([
                apiService.getRetailerDetails(retailerId),
                apiService.getRetailerCategories(retailerId),
                apiService.getFeaturedProducts(retailerId),
                apiService.fetchUserProfile().catch((e) => {
                    console.error("FETCH USER PROFILE FAILED:", e);
                    return { referral_code: '' };
                })
            ]);

            console.log("RETAILER DATA:", retailerData);
            console.log("USER PROFILE:", userProfile);

            setRetailer(retailerData);

            if (typeof window !== 'undefined') {
                localStorage.setItem('current_retailer_id', retailerId);
            }

            setCategories(Array.isArray(catData) ? catData : catData.results || []);

            const products = (Array.isArray(featData) ? featData : featData.results || []).map((p: any) => ({
                ...p,
                price: p.discounted_price || p.price,
                mrp: p.original_price || p.price,
                image: p.image || '',
                stock_quantity: p.quantity || 0,
                unit: p.unit || 'Unit'
            }));
            setFeaturedProducts(products);

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
                        <Link href={`/retailer/${retailerId}/categories`} className={styles.seeAll}>
                            See All <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div className={styles.categoriesScroll}>
                        {categories.slice(0, 12).map(cat => (
                            <Link href={`/retailer/${retailerId}/category/${cat.id}`} key={cat.id} className={styles.categoryItem}>
                                <div className={styles.catIcon}>
                                    <ShoppingBag size={24} />
                                </div>
                                <span className={styles.catName}>{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Featured Products */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Featured Products</h2>
                    </div>
                    <div className={styles.productsScroll}>
                        {featuredProducts.map(product => {
                            const discount = product.mrp > product.price
                                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                                : 0;

                            return (
                                <div key={product.id} className={styles.productCard} onClick={() => router.push(`/retailer/${retailerId}/product/${product.id}`)}>
                                    <div className={styles.productImage}>
                                        {discount > 0 && (
                                            <div className={styles.discountBadge}>{discount}% OFF</div>
                                        )}
                                        <ProductImage
                                            src={product.image || ''}
                                            alt={product.name}
                                            className="w-full h-full"
                                        />

                                        <div className={styles.wishlistIcon} onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleWishlist(product.id);
                                        }}>
                                            <WishlistIcon isWishlisted={isWishlisted(product.id)} />
                                        </div>
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
                </section>

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
                    <button className={styles.viewAllBtn} onClick={() => router.push(`/retailer/${retailerId}/products`)}>
                        View All Products
                    </button>
                </div>
            </main>
        </div>
    );
}
