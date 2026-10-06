'use client';
import LoadingScreen from '@/app/components/LoadingScreen';
import toast from '@/lib/toast';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import NotificationDropdown from '@/app/components/NotificationDropdown';
import { useNotification } from '@/context/NotificationContext';
import { ShoppingBag, Search, MapPin, ChevronRight, ChevronDown, Copy, Star, Bell, Gem, Gift, Users, Clock, AlertTriangle, Bike, PackageCheck, Sparkles, X } from 'lucide-react';
import { apiService } from '@/services/api';
import { useWishlist } from '@/hooks/useWishlist';
import { useCartContext } from '@/context/CartContext';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import { ProductImage } from '@/app/components/ProductImage';
import { ProductCard } from '@/app/components/ProductCard';
import { Button } from '@/app/components/ui/Button';
import LazyProductLane from '@/app/components/LazyProductLane';
import InfiniteProductGrid from '@/app/components/InfiniteProductGrid';
import { processRetailerProductList } from '@/utils/productStock';
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
            setSuggestions(processRetailerProductList(data));
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

            const processProducts = (data: unknown) => processRetailerProductList(data);

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
                    <div className={styles.headerInner}>
                        <div className={styles.topBar}>
                            <div className="flex items-center gap-3">
                                <div className="oe-skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
                                <div className="flex flex-col gap-2">
                                    <div className="oe-skeleton" style={{ width: 70, height: 10 }} />
                                    <div className="oe-skeleton" style={{ width: 150, height: 16 }} />
                                </div>
                            </div>
                            <div className="oe-skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
                        </div>
                        <div className="oe-skeleton" style={{ height: 46, borderRadius: 14 }} />
                    </div>
                </header>
                <main className={styles.main}>
                    <div className={`oe-skeleton ${styles.skeletonBanner}`} />
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className="oe-skeleton" style={{ width: 160, height: 18 }} />
                        </div>
                        <div className={styles.categoriesGrid}>
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className={styles.categoryItem}>
                                    <div className={`oe-skeleton ${styles.skeletonCatIcon}`}></div>
                                    <div className={`oe-skeleton ${styles.skeletonCatText}`}></div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className="oe-skeleton" style={{ width: 140, height: 18 }} />
                        </div>
                        <div className={styles.productsScroll}>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`oe-skeleton ${styles.skeletonCard}`}></div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        );
    }
    if (!retailer) {
        return (
            <div className={styles.notFound}>
                <div className={styles.notFoundIcon}><ShoppingBag size={28} /></div>
                <h1>Store not found</h1>
                <p>This store may be unavailable right now.</p>
                <Button onClick={() => router.push('/retailers')}>Browse stores</Button>
            </div>
        );
    }

    const isOffline = !retailer.offers_delivery && !retailer.offers_pickup;
    const showRewards = offers.length > 0 ||
        (retailer.is_referral_enabled && (referralCode || apiService.isAuthenticated())) ||
        (retailer.is_reward_active || (userLoyalty && userLoyalty.points > 0));

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
                <div className={styles.headerInner}>
                    <div className={styles.topBar}>
                        <button
                            type="button"
                            className={styles.shopSelector}
                            onClick={() => router.push('/retailers')}
                            aria-label="Change store"
                        >
                            <span className={styles.shopAvatar}>
                                {retailer.shop_image ? (
                                    <img src={retailer.shop_image} alt="" />
                                ) : (
                                    (retailer.shop_name || 'S').charAt(0).toUpperCase()
                                )}
                            </span>
                            <span className={styles.shopText}>
                                <span className={styles.shoppingAtLabel}>Shopping at</span>
                                <span className={styles.shopNameRow}>
                                    <span className={styles.shopName}>{retailer.shop_name}</span>
                                    <ChevronDown size={16} className={styles.rotateIcon} />
                                </span>
                            </span>
                        </button>

                        <div className={styles.authContainer}>
                            {!isAuthenticated && (
                                <Link href="/login" className={styles.loginBtn}>
                                    Log in
                                </Link>
                            )}
                            <button
                                type="button"
                                className={styles.iconBtn}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => setShowNotifications(!showNotifications)}
                                aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
                                aria-expanded={showNotifications}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                            </button>
                            {isAuthenticated && (
                                <Link href="/profile" className={styles.avatar} aria-label="Your profile">
                                    {(userName || 'U').charAt(0).toUpperCase()}
                                </Link>
                            )}
                        </div>
                    </div>

                    <NotificationDropdown
                        isOpen={showNotifications}
                        onClose={() => setShowNotifications(false)}
                    />

                    <form className={styles.searchBar} onSubmit={handleSearch} role="search">
                        <Search className={styles.searchIcon} size={19} />
                        <input
                            type="search"
                            placeholder={`Search in ${retailer.shop_name || 'store'}…`}
                            aria-label="Search products"
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className={styles.searchClear}
                                onClick={() => setSearchQuery('')}
                                aria-label="Clear search"
                            >
                                <X size={16} />
                            </button>
                        )}

                        {showSuggestions && (
                            <div className={styles.suggestionsContainer}>
                                {isSearching ? (
                                    <div className={styles.noSuggestions}>Searching…</div>
                                ) : suggestions.length > 0 ? (
                                    <>
                                        {suggestions.map((product) => (
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
                                                        {product.unit && <span>· {product.unit}</span>}
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className={styles.suggestionChevron} />
                                            </div>
                                        ))}
                                        <button type="submit" className={styles.suggestionAll}>
                                            <Search size={14} /> See all results for &ldquo;{searchQuery.trim()}&rdquo;
                                        </button>
                                    </>
                                ) : (
                                    <div className={styles.noSuggestions}>No products found for &ldquo;{searchQuery}&rdquo;</div>
                                )}
                            </div>
                        )}
                    </form>
                </div>
            </header>

            <main className={styles.main}>
                {/* Store info */}
                <section className={styles.storeHeaderInfo}>
                    <div className={styles.storeMetaRow}>
                        {retailer.average_rating ? (
                            <span className={styles.ratingBadge}>
                                <Star size={12} fill="currentColor" /> {Number(retailer.average_rating).toFixed(1)}
                            </span>
                        ) : null}
                        <span className={retailer.is_currently_open ? styles.statusOpen : styles.statusClosed}>
                            <span className={styles.statusDot} />
                            {retailer.is_currently_open ? 'Open now' : 'Closed'}
                        </span>
                        {retailer.offers_delivery && (
                            <span className={styles.metaChip}><Bike size={13} /> Delivery</span>
                        )}
                        {retailer.offers_pickup && (
                            <span className={styles.metaChip}><PackageCheck size={13} /> Pickup</span>
                        )}
                    </div>
                    <button
                        type="button"
                        className={styles.storeAddress}
                        onClick={() => router.push('/city-selection')}
                    >
                        <MapPin size={13} />
                        <span>
                            {retailer.address_line1 || `${retailer.city || ''}, ${retailer.state || ''}`}
                            {selectedCity?.name ? ` · Delivering to ${selectedCity.name}${selectedCity?.pincode ? ` (${selectedCity.pincode})` : ''}` : ''}
                        </span>
                    </button>

                    {!retailer.is_currently_open && (
                        <div className={styles.noticeInfo}>
                            <Clock size={16} />
                            <span>
                                <strong>Store is closed.</strong> Orders placed now will be processed from{' '}
                                <strong className="whitespace-nowrap">{retailer.next_open_time || 'next open time'}</strong>.
                            </span>
                        </div>
                    )}
                    {isOffline && (
                        <div className={styles.noticeDanger}>
                            <AlertTriangle size={16} />
                            <span><strong>Not accepting orders.</strong> This store is currently offline.</span>
                        </div>
                    )}
                </section>

                {/* ===== Combined Rewards Strip (Offers + Refer + Loyalty) ===== */}
                {showRewards && (
                    <div className={styles.rewardsPanel}>
                        <div className={styles.rewardsTabs} role="tablist">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeRewardTab === 'offers'}
                                className={`${styles.rewardsTab} ${activeRewardTab === 'offers' ? styles.activeTab : ''}`}
                                onClick={() => setActiveRewardTab('offers')}
                            >
                                <Gift size={15} /> Offers
                            </button>
                            {retailer.is_referral_enabled && (
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={activeRewardTab === 'refer'}
                                    className={`${styles.rewardsTab} ${activeRewardTab === 'refer' ? styles.activeTab : ''}`}
                                    onClick={() => setActiveRewardTab('refer')}
                                >
                                    <Users size={15} /> Refer
                                </button>
                            )}
                            {(retailer.is_reward_active || (userLoyalty && userLoyalty.points > 0)) && (
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={activeRewardTab === 'points'}
                                    className={`${styles.rewardsTab} ${activeRewardTab === 'points' ? styles.activeTab : ''}`}
                                    onClick={() => setActiveRewardTab('points')}
                                >
                                    <Gem size={15} /> Points
                                </button>
                            )}
                        </div>

                        <div className={styles.rewardsContent}>
                            {/* Offers Tab */}
                            {activeRewardTab === 'offers' && offers.length > 0 && (
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
                                                <div className={`${styles.offerFallback} ${styles[`offerTone${idx % 3}`]}`}>
                                                    <span className={styles.offerEyebrow}><Sparkles size={12} /> Limited offer</span>
                                                    <div className={styles.offerName}>{offer.name}</div>
                                                    <div className={styles.offerDesc}>{offer.description || 'Limited Time Offer!'}</div>
                                                    <span className={styles.offerCta}>Shop now <ChevronRight size={14} /></span>
                                                    <Gift className={styles.offerArt} size={120} strokeWidth={1.25} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {offers.length > 1 && (
                                        <div className={styles.sliderDots}>
                                            {offers.map((_, idx) => (
                                                <button
                                                    type="button"
                                                    key={idx}
                                                    aria-label={`Show offer ${idx + 1}`}
                                                    className={`${styles.dot} ${idx === currentOfferIndex ? styles.activeDot : ''}`}
                                                    onClick={() => setCurrentOfferIndex(idx)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeRewardTab === 'offers' && offers.length === 0 && (
                                <div className={styles.rewardsEmpty}>
                                    <Gift size={22} />
                                    No active offers right now. Check back soon!
                                </div>
                            )}

                            {/* Refer & Earn Tab */}
                            {activeRewardTab === 'refer' && retailer.is_referral_enabled && (
                                <div className={styles.referContent}>
                                    <div className={styles.referText}>
                                        <div className={styles.referTitle}>
                                            <Star className="fill-amber-300 text-amber-300" size={18} />
                                            Refer & Earn {retailer.referral_reward_points > 0 ? `(₹${retailer.referral_reward_points})` : ''}
                                        </div>
                                        <p className={styles.referSubtitle}>
                                            Earn {retailer.referral_reward_points} pts on your friend&apos;s first order above ₹{retailer.min_referral_order_amount}!
                                        </p>
                                    </div>
                                    {referralCode ? (
                                        <div className={styles.codeBox}>
                                            <span className={styles.code}>{referralCode}</span>
                                            <button
                                                type="button"
                                                className={styles.copyBtn}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(referralCode);
                                                    toast.success("Code copied!");
                                                }}
                                            >
                                                <Copy size={14} /> Copy
                                            </button>
                                        </div>
                                    ) : apiService.isAuthenticated() ? (
                                        <div className={styles.referHint}>
                                            Code unavailable. <button type="button" onClick={() => window.location.reload()}>Retry</button>
                                        </div>
                                    ) : (
                                        <Link href="/login" className={styles.referLogin}>Log in to view your code</Link>
                                    )}
                                </div>
                            )}

                            {/* Loyalty Points Tab */}
                            {activeRewardTab === 'points' && (
                                <div className={`${styles.referContent} ${styles.pointsContent}`}>
                                    <div className={styles.referText}>
                                        <div className={styles.referTitle}>
                                            <Gem className="fill-sky-200 text-sky-200" size={18} />
                                            My Shop Points
                                        </div>
                                        {retailer.is_reward_active && (
                                            <div className={styles.earningRule}>
                                                {retailer.loyalty_earning_type === 'percentage'
                                                    ? `Earn ${retailer.loyalty_earning_value}% Gems on every order!`
                                                    : `Earn 1 Gem for every ₹${parseFloat(retailer.loyalty_earning_value).toFixed(0)} spent!`}
                                                {parseFloat(retailer.loyalty_min_order_value) > 0 && ` (Min order ₹${parseFloat(retailer.loyalty_min_order_value).toFixed(0)})`}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.pointsValue}>
                                        {apiService.isAuthenticated() ? (
                                            <>
                                                <span className={styles.pointsLarge}>{userLoyalty?.points || 0}</span>
                                                <span className={styles.pointsLabel}>Available</span>
                                            </>
                                        ) : (
                                            <Link href="/login" className={styles.referLogin}>Log in to check balance</Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Categories */}
                {categories.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Shop by category</h2>
                            <Link href={`/retailer/categories?retailerId=${retailerId}`} className={styles.seeAll}>
                                See all <ChevronRight size={14} />
                            </Link>
                        </div>

                        <div className={styles.categoriesGrid}>
                            {categories.slice(0, 12).map(cat => (
                                <Link href={`/retailer/category?retailerId=${retailerId}&categoryId=${cat.id}`} key={cat.id} className={styles.categoryItem}>
                                    <div className={styles.catIcon}>
                                        {cat.image ? (
                                            <img src={cat.image} alt="" />
                                        ) : cat.icon ? (
                                            <img src={cat.icon} alt="" />
                                        ) : (
                                            <ShoppingBag size={24} strokeWidth={1.75} />
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
                )}

                {featuredProducts.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Featured products</h2>
                        </div>
                        <div className={styles.productsScroll}>
                            {featuredProducts.map(product => (
                                <ProductCard
                                    key={`featured-${product.id}`}
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

                {bestSellingProducts.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Best sellers</h2>
                        </div>
                        <div className={styles.productsScroll}>
                            {bestSellingProducts.map(product => (
                                <ProductCard
                                    key={`best-${product.id}`}
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

                {buyAgainProducts.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Buy again</h2>
                            <span className={styles.sectionTag}>Based on your orders</span>
                        </div>
                        <div className={styles.productsScroll}>
                            {buyAgainProducts.map(product => (
                                <ProductCard
                                    key={`again-${product.id}`}
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

                {recommendedProducts.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Recommended for you</h2>
                        </div>
                        <div className={styles.productsScroll}>
                            {recommendedProducts.map(product => (
                                <ProductCard
                                    key={`rec-${product.id}`}
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

                {/* Lazy Loaded Discovery Lanes */}
                {retailerId && (
                    <>
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
                    </>
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
