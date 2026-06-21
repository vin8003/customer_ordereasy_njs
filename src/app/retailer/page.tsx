'use client';
import LoadingScreen from '@/app/components/LoadingScreen';
import toast from 'react-hot-toast';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import NotificationDropdown from '@/app/components/NotificationDropdown';
import { useNotification } from '@/context/NotificationContext';
import { ShoppingBag, Search, MapPin, ChevronRight, Copy, Star, Heart, Bell, Gem } from 'lucide-react';
import { apiService } from '@/services/api';
import { useWishlist } from '@/hooks/useWishlist';
import { useCartContext } from '@/context/CartContext';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import { ProductImage } from '@/app/components/ProductImage';
import { ProductCard } from '@/app/components/ProductCard';
import { Button } from '@/app/components/ui/Button';
import LazyProductLane from '@/app/components/LazyProductLane';
import InfiniteProductGrid from '@/app/components/InfiniteProductGrid';
import styles from './RetailerHome.module.css';

interface Category {
    id: number;
    name: string;
    icon?: string;
    image?: string;
    product_count?: number;
    parent?: number | null;
}

export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    mrp: number;
    image: string;
    category_name?: string;
    stock_quantity: number;
    track_inventory: boolean;
    unit?: string;
    minimum_order_quantity?: number;
    maximum_order_quantity?: number | null;
}

function RetailerHome() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const retailerId = id as string;

    const [retailer, setRetailer] = useState<any>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
    const [buyAgainProducts, setBuyAgainProducts] = useState<Product[]>([]);
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [referralCode, setReferralCode] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isBannerHovered, setIsBannerHovered] = useState(false);
    const [userLoyalty, setUserLoyalty] = useState<{ points: number } | null>(null);
    const [activeRewardTab, setActiveRewardTab] = useState<'offers' | 'refer' | 'points'>('offers');

    const [showNotifications, setShowNotifications] = useState(false);
    const { unreadCount, refreshNotifications } = useNotification();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState('');
    const [selectedCity, setSelectedCity] = useState<any>(null);

    // Use shared wishlist and cart hooks
    const { wishlistIds, loadWishlist, toggleWishlist, isWishlisted } = useWishlist();
    const { cartCount } = useCartContext();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                fetchSuggestions();
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchSuggestions = async () => {
        setIsSearching(true);
        try {
            const data = await apiService.searchProducts(retailerId, searchQuery);
            setSuggestions(Array.isArray(data) ? data : data.results || []);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Suggestions fetch failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSuggestions(false);
            router.push(`/retailer/products?retailerId=${retailerId}&search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = async () => {
        await apiService.logout();
        setIsAuthenticated(false);
        setUserName('');
        window.location.reload();
    };

    useEffect(() => {
        const storedCity = localStorage.getItem('selected_city');
        if (storedCity) {
            try {
                setSelectedCity(JSON.parse(storedCity));
            } catch (e) {
                console.error(e);
            }
        }
        if (retailerId) {
            loadData();
            if (apiService.isAuthenticated()) {
                loadWishlist(); // Load wishlist only if authenticated
                refreshNotifications();
            }
        }
    }, [retailerId, loadWishlist]);

    useEffect(() => {
        if (offers.length <= 1 || isBannerHovered || touchStartX !== null) return;

        const interval = setInterval(() => {
            setCurrentOfferIndex((prev) => (prev + 1) % offers.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [offers.length, currentOfferIndex, isBannerHovered, touchStartX]);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null) return;

        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchStartX - touchEndX;
        const minSwipeDistance = 50;

        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                // Swiped left -> Next
                setCurrentOfferIndex((prev) => (prev + 1) % offers.length);
            } else {
                // Swiped right -> Previous
                setCurrentOfferIndex((prev) => (prev - 1 + offers.length) % offers.length);
            }
        }
        setTouchStartX(null);
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [retailerData, catData, featData, bestData, againData, recData, userProfile, loyaltyData] = await Promise.all([
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
                apiService.isAuthenticated() ? apiService.fetchUserProfile().catch((e) => {
                    console.error("FETCH USER PROFILE FAILED:", e);
                    return { referral_code: '' };
                }) : Promise.resolve({ referral_code: '' }),
                apiService.isAuthenticated() ? apiService.getCustomerLoyalty(retailerId).catch((e) => {
                    console.error("Loyalty fetch error:", e);
                    return { points: 0 };
                }) : Promise.resolve({ points: 0 })
            ]);

            setRetailer(retailerData);
            setUserLoyalty(loyaltyData);

            if (typeof window !== 'undefined') {
                localStorage.setItem('current_retailer_id', retailerId);
            }

            setCategories(Array.isArray(catData) ? catData : catData.results || []);

            // Process Offers
            const offersData = await apiService.getRetailerOffers(retailerId);
            setOffers(Array.isArray(offersData) ? offersData : offersData.results || []);

            const processProducts = (data: any) => (Array.isArray(data) ? data : data.results || []).map((p: any) => ({
                ...p,
                price: p.discounted_price || p.price,
                mrp: p.original_price || p.price,
                image: p.image || '',
                stock_quantity: p.quantity || 0,
                track_inventory: p.track_inventory ?? true,
                unit: p.unit || 'Unit',
                minimum_order_quantity: p.minimum_order_quantity || 1,
                maximum_order_quantity: p.maximum_order_quantity
            }));

            setFeaturedProducts(processProducts(featData));
            setBestSellingProducts(processProducts(bestData)); // Removed .data || []
            setBuyAgainProducts(processProducts(againData));   // Removed .data || []
            setRecommendedProducts(processProducts(recData));  // Removed .data || []

            if (userProfile && userProfile.referral_code) {
                setReferralCode(userProfile.referral_code);
            }
            if (apiService.isAuthenticated()) {
                setIsAuthenticated(true);
                if (userProfile) {
                    setUserName(userProfile.first_name || 'User');
                }
            }

        } catch (e) {
            console.error("Failed to load retailer data", e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!retailer && isLoading) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col gap-2">
                            <div className={`${styles.skeleton} h-4 w-24 rounded`}></div>
                            <div className={`${styles.skeleton} h-6 w-40 rounded`}></div>
                        </div>
                        <div className="flex gap-2">
                            <div className={`${styles.skeleton} h-10 w-10 rounded-full`}></div>
                            <div className={`${styles.skeleton} h-10 w-10 rounded-full`}></div>
                        </div>
                    </div>
                    <div className={`${styles.skeleton} h-12 w-full rounded-2xl`}></div>
                </header>
                <main className={styles.main}>
                    <section className={styles.section}>
                        <div className="flex justify-between px-5 mb-4">
                            <div className={`${styles.skeleton} h-6 w-32 rounded`}></div>
                            <div className={`${styles.skeleton} h-6 w-16 rounded`}></div>
                        </div>
                        <div className={styles.categoriesScroll}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className={styles.categoryItem}>
                                    <div className={`${styles.skeleton} ${styles.skeletonCatIcon}`}></div>
                                    <div className={`${styles.skeleton} ${styles.skeletonCatText}`}></div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className={styles.section}>
                        <div className="flex justify-between px-5 mb-4">
                            <div className={`${styles.skeleton} h-6 w-40 rounded`}></div>
                        </div>
                        <div className={styles.productsScroll}>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`}></div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        );
    }
    if (!retailer) return <div className="p-8 text-center">Retailer not found</div>;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
                <div className={styles.topBar}>
                    <div
                        className={styles.locationBar}
                        onClick={() => router.push('/city-selection')}
                        style={{ cursor: 'pointer' }}
                    >
                        <MapPin size={14} className={styles.locationIcon} />
                        <span>{selectedCity?.name || 'Select City'} {selectedCity?.pincode ? `(${selectedCity.pincode})` : ''}</span>
                    </div>

                    <div className={styles.authContainer}>
                        {isAuthenticated && (
                            <span className={styles.userName}>Hi, {userName}</span>
                        )}
                        
                        <div className="relative" style={{ display: 'flex', alignItems: 'center' }}>
                            <button
                                className={styles.actionBtn}
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ marginRight: '8px' }}
                            >
                                <div className={styles.iconWrapper}>
                                    <Bell size={20} />
                                    {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                                </div>
                            </button>
                            <NotificationDropdown
                                isOpen={showNotifications}
                                onClose={() => setShowNotifications(false)}
                            />
                        </div>

                        {isAuthenticated ? (
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className={styles.logoutButton}
                                style={{ padding: '0 4px', fontSize: '0.85rem' }}
                            >
                                Logout
                            </Button>
                        ) : (
                            <Link href="/login">
                                <Button variant="outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Login</Button>
                            </Link>
                        )}
                    </div>
                </div>

                <div className={styles.logoContainer}>
                    <img
                        src="/assets/images/logo.png"
                        alt="Order Easy Logo"
                        className={styles.logo}
                    />
                </div>

                <div className={styles.storeHeaderInfo}>
                    <div className={styles.shoppingAtLabel}>Shopping at:</div>
                    <div className={styles.storeHeaderRow}>
                        <div className={styles.shopSelector} onClick={() => router.push('/retailers')}>
                            <h1 className={styles.shopName}>{retailer?.shop_name || 'Loading...'}</h1>
                            <ChevronRight size={16} className={styles.rotateIcon} />
                        </div>
                        {retailer?.average_rating && (
                            <div className={styles.ratingBadge}>
                                ★ {retailer.average_rating} stars
                            </div>
                        )}
                    </div>
                    <div className={styles.storeAddress}>
                        {retailer?.address_line1 || `${retailer?.city || ''}, ${retailer?.state || ''}`}
                    </div>

                    {retailer && !retailer.is_currently_open && (
                        <div className="mt-1.5">
                            <div className="inline-block text-[10px] font-medium text-indigo-800 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 leading-relaxed">
                                🌙 <span className="font-bold">Closed.</span> Orders placed now will be processed starting at <span className="font-bold whitespace-nowrap">{retailer.next_open_time || 'next open time'}</span>.
                            </div>
                        </div>
                    )}
                    {retailer && !retailer.offers_delivery && !retailer.offers_pickup && (
                        <div className="mt-1.5">
                            <div className="inline-block text-[10px] font-bold text-red-800 bg-red-50 px-2 py-1 rounded border border-red-200 leading-relaxed animate-pulse">
                                ⚠️ <span className="uppercase">Not Accepting Orders.</span> This store is currently offline.
                            </div>
                        </div>
                    )}
                </div>

                <form className={styles.searchBar} onSubmit={handleSearch}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Search for products..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />

                    {showSuggestions && (
                        <div className={styles.suggestionsContainer}>
                            {isSearching ? (
                                <div className={styles.noSuggestions}>Searching...</div>
                            ) : suggestions.length > 0 ? (
                                suggestions.map((product) => (
                                    <div
                                        key={product.id}
                                        className={styles.suggestionItem}
                                        onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                                    >
                                        <div className={styles.suggestionImage}>
                                            <ProductImage src={product.image} alt={product.name} />
                                        </div>
                                        <div className={styles.suggestionInfo}>
                                            <div className={styles.suggestionName}>{product.name}</div>
                                            <div className={styles.suggestionMeta}>
                                                <span className={styles.suggestionPrice}>₹{product.price}</span>
                                                {product.unit && <span>• {product.unit}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.noSuggestions}>No products found for "{searchQuery}"</div>
                            )}
                        </div>
                    )}
                </form>
            </header>

            <main className={styles.main}>

                {/* ===== Combined Rewards Strip (Offers + Refer + Loyalty) ===== */}
                {(offers.length > 0 || 
                  (retailer.is_referral_enabled && (referralCode || apiService.isAuthenticated())) ||
                  (retailer.is_reward_active || (userLoyalty && userLoyalty.points > 0))
                ) && (
                    <div className={styles.rewardsPanel}>
                        {/* Tab switcher */}
                        <div className={styles.rewardsTabs}>
                            <button
                                className={`${styles.rewardsTab} ${activeRewardTab === 'offers' ? styles.activeTab : ''}`}
                                onClick={() => setActiveRewardTab('offers')}
                            >
                                🎁 Offers
                            </button>
                            {retailer.is_referral_enabled && (
                                <button
                                    className={`${styles.rewardsTab} ${activeRewardTab === 'refer' ? styles.activeTab : ''}`}
                                    onClick={() => setActiveRewardTab('refer')}
                                >
                                    ⭐ Refer
                                </button>
                            )}
                            {(retailer.is_reward_active || (userLoyalty && userLoyalty.points > 0)) && (
                                <button
                                    className={`${styles.rewardsTab} ${activeRewardTab === 'points' ? styles.activeTab : ''}`}
                                    onClick={() => setActiveRewardTab('points')}
                                >
                                    💎 Points
                                </button>
                            )}
                        </div>

                        <div className={styles.rewardsContent}>
                            {/* Offers Tab */}
                            {activeRewardTab === 'offers' && offers.length > 0 && (
                                <div>
                                    <div
                                        className={styles.slimBannerStack}
                                        onTouchStart={handleTouchStart}
                                        onTouchEnd={handleTouchEnd}
                                        onMouseEnter={() => setIsBannerHovered(true)}
                                        onMouseLeave={() => setIsBannerHovered(false)}
                                    >
                                        {offers.map((offer, idx) => (
                                            <div
                                                key={offer.id}
                                                className={`${styles.bannerItem} ${idx === currentOfferIndex ? styles.activeBanner : ''}`}
                                                onClick={() => router.push(`/retailer/products?retailerId=${retailerId}&offerId=${offer.id}&title=${encodeURIComponent(offer.name)}`)}
                                            >
                                                {offer.banner_image ? (
                                                    <img src={offer.banner_image} alt={offer.name} className={styles.bannerImage} />
                                                ) : (
                                                    <div className={styles.offerFallback}>
                                                        <div className={styles.offerName}>{offer.name}</div>
                                                        <div className={styles.offerDesc}>{offer.description || 'Limited Time Offer!'}</div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {offers.length > 1 && (
                                            <div className={styles.sliderDots}>
                                                {offers.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        className={`${styles.dot} ${idx === currentOfferIndex ? styles.activeDot : ''}`}
                                                        onClick={() => setCurrentOfferIndex(idx)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {activeRewardTab === 'offers' && offers.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                                    No active offers right now. Check back soon! 🛒
                                </div>
                            )}

                            {/* Refer & Earn Tab */}
                            {activeRewardTab === 'refer' && retailer.is_referral_enabled && (
                                <div className={styles.referContent}>
                                    <div className={styles.referTitle}>
                                        <Star className="text-yellow-300 fill-yellow-300" size={20} />
                                        Refer & Earn {retailer.referral_reward_points > 0 ? `(₹${retailer.referral_reward_points})` : ''}
                                    </div>
                                    <p className={styles.referSubtitle}>
                                        Earn {retailer.referral_reward_points} pts on your friend's first order above ₹{retailer.min_referral_order_amount}!
                                    </p>
                                    {referralCode ? (
                                        <div className={styles.codeBox}>
                                            <span className={styles.code}>{referralCode}</span>
                                            <div className={styles.referralActions}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(referralCode);
                                                        toast.success("Code copied!");
                                                    }}
                                                >
                                                    <Copy size={14} /> Copy
                                                </button>
                                            </div>
                                        </div>
                                    ) : apiService.isAuthenticated() ? (
                                        <div className="text-center" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                                            Code unavailable. <button onClick={() => window.location.reload()} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Retry</button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Link href="/login" className="text-white font-bold underline">Login to view code</Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Loyalty Points Tab */}
                            {activeRewardTab === 'points' && (
                                <div className={styles.referContent}>
                                    <div className={styles.referTitle}>
                                        <Gem className="text-blue-300 fill-blue-300" size={20} />
                                        My Shop Points
                                    </div>
                                    <div className={styles.pointsBalanceBox}>
                                        <div className={styles.pointsValue}>
                                            {apiService.isAuthenticated() ? (
                                                <>
                                                    <span className={styles.pointsLarge}>{userLoyalty?.points || 0}</span>
                                                    <span className={styles.pointsLabel}>Available Points</span>
                                                </>
                                            ) : (
                                                <Link href="/login" className="text-white underline">Login to check balance</Link>
                                            )}
                                        </div>
                                        {retailer.is_reward_active && (
                                            <div className={styles.earningRule}>
                                                🔥 {retailer.loyalty_earning_type === 'percentage' 
                                                    ? `Earn ${retailer.loyalty_earning_value}% Gems on every order!` 
                                                    : `Earn 1 Gem for every ₹${parseFloat(retailer.loyalty_earning_value).toFixed(0)} spent!`}
                                                {parseFloat(retailer.loyalty_min_order_value) > 0 && ` (Min order ₹${parseFloat(retailer.loyalty_min_order_value).toFixed(0)})`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
                                    {cat.image ? (
                                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                    ) : cat.icon ? (
                                        <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ShoppingBag size={24} />
                                    )}
                                </div>
                                <span className={styles.catName}>{cat.name}</span>
                                {cat.product_count !== undefined && (
                                    <span className={styles.catCount}>{cat.product_count} items</span>
                                )}
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
                                    onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                                    offersDelivery={retailer.offers_delivery}
                                    offersPickup={retailer.offers_pickup}
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
                                    onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                                    offersDelivery={retailer.offers_delivery}
                                    offersPickup={retailer.offers_pickup}
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
                                    onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                                    offersDelivery={retailer.offers_delivery}
                                    offersPickup={retailer.offers_pickup}
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
                                    onClick={() => router.push(`/retailer/product?retailerId=${retailerId}&productId=${product.id}`)}
                                    offersDelivery={retailer.offers_delivery}
                                    offersPickup={retailer.offers_pickup}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Offers and Referral have been moved to the top Rewards Panel */}

                {/* Lazy Loaded Discovery Lanes */}
                {retailerId && (
                    <div className="mt-8 space-y-6">
                        <LazyProductLane
                            title="Deals of the Day"
                            fetchFn={() => apiService.getDealsOfTheDay(retailerId)}
                            retailerId={retailerId}
                            offersDelivery={retailer.offers_delivery}
                            offersPickup={retailer.offers_pickup}
                        />
                        <LazyProductLane
                            title="Under ₹99 Store"
                            fetchFn={() => apiService.getBudgetBuys(retailerId)}
                            retailerId={retailerId}
                            offersDelivery={retailer.offers_delivery}
                            offersPickup={retailer.offers_pickup}
                        />
                        <LazyProductLane
                            title="Trending Now"
                            fetchFn={() => apiService.getTrendingProducts(retailerId)}
                            retailerId={retailerId}
                            offersDelivery={retailer.offers_delivery}
                            offersPickup={retailer.offers_pickup}
                        />
                        <LazyProductLane
                            title="New Arrivals"
                            fetchFn={() => apiService.getNewArrivals(retailerId)}
                            retailerId={retailerId}
                            offersDelivery={retailer.offers_delivery}
                            offersPickup={retailer.offers_pickup}
                        />
                        <LazyProductLane
                            title="Seasonal Picks"
                            fetchFn={() => apiService.getSeasonalPicks(retailerId)}
                            retailerId={retailerId}
                            offersDelivery={retailer.offers_delivery}
                            offersPickup={retailer.offers_pickup}
                        />
                    </div>
                )}

                {/* Infinite Scrolling Product Grid */}
                {retailerId && (
                    <InfiniteProductGrid 
                        retailerId={retailerId} 
                        offersDelivery={retailer.offers_delivery}
                        offersPickup={retailer.offers_pickup}
                    />
                )}

            </main>

        </div>
    );
}

export default function RetailerHomePage() {
    return (
        <Suspense fallback={<LoadingScreen message="Loading..." />}>
            <RetailerHome />
        </Suspense>
    );
}
