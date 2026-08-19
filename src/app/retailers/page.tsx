'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, ShoppingBag, Star, Clock, ChevronRight } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { getPersistedLocation, StoredLocation } from '@/utils/location';
import styles from './Retailers.module.css';

interface Retailer {
    id: number;
    shop_name: string;
    business_type: string;
    city: string;
    state: string;
    average_rating: number;
    offers_delivery: boolean;
    offers_pickup: boolean;
    shop_image?: string;
    distance?: number;
    categories?: any[];
}

export default function RetailersPage() {
    const router = useRouter();
    const [retailers, setRetailers] = useState<Retailer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCity, setSelectedCity] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const stored = getPersistedLocation();

        if (!stored) {
            // Do not silently pin Bharatpur — send the user to choose / grant location.
            router.replace('/city-selection');
            return;
        }

        setSelectedCity(stored);
        fetchRetailers(stored);

        // Check Auth Status
        if (apiService.isAuthenticated()) {
            setIsAuthenticated(true);
            apiService.fetchUserProfile().then(profile => {
                setUserName(profile.first_name || 'User');
            }).catch(e => console.error("Profile fetch failed", e));
        }
    }, [router]);

    const fetchRetailers = async (loc: StoredLocation) => {
        setIsLoading(true);
        try {
            const params: Record<string, string | number> = {};
            if (loc.pincode) params.user_pincode = loc.pincode;
            if (loc.lat && loc.lng) {
                params.lat = loc.lat;
                params.lng = loc.lng;
            }
            const data = await apiService.getRetailers(params);
            setRetailers(data.results || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load retailers. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetailerSelect = (id: number) => {
        router.push(`/retailer?id=${id}`);
    };

    const handleLogout = async () => {
        await apiService.logout();
        setIsAuthenticated(false);
        setUserName('');
        // Optional: reload to ensure clean state
        window.location.reload();
    };

    const getImageUrl = (path?: string) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `https://api.ordereasy.win${path.startsWith('/') ? '' : '/'}${path}`;
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Finding stores in {selectedCity ? selectedCity.name : 'your area'}...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.topBar}>
                    <div
                        className={styles.locationBar}
                        onClick={() => router.push('/city-selection')}
                        style={{ cursor: 'pointer' }}
                    >
                        <MapPin size={16} className={styles.locationIcon} />
                        <span>{selectedCity?.name}{selectedCity?.pincode ? ` (${selectedCity.pincode})` : ''}</span>
                    </div>

                    <div className={styles.authContainer}>
                        {isAuthenticated ? (
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>Hi, {userName}</span>
                            </div>
                        ) : (
                            <Link href="/login">
                                <Button variant="outline" className={styles.loginButton}>Login / Signup</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <div className={styles.headerInstructionsCard}>
                <div className={styles.cardLogoContainer}>
                    <img
                        src="/assets/images/logo.png"
                        alt="Order Easy Logo"
                        className={styles.cardLogo}
                    />
                </div>
                <h1>Select a Store</h1>
                <p className={styles.subtext}>Choose a retailer to start shopping</p>

                <div className={styles.cardServiceNotice}>
                    <MapPin size={16} className={styles.noticeIcon} />
                    <p>Currently serving only in <strong>{selectedCity?.name}</strong>.</p>
                </div>
            </div>

            {error && (
                <div className={styles.errorContainer}>
                    <p>{error}</p>
                    <Button onClick={() => selectedCity && fetchRetailers(selectedCity)} variant="outline">Retry</Button>
                </div>
            )}

            {retailers.length === 0 && !error ? (
                <div className={styles.emptyState}>
                    <ShoppingBag size={48} />
                    <p>No retailers found serving {selectedCity?.name} ({selectedCity?.pincode}).</p>
                </div>
            ) : (
                <div className={styles.retailerList}>
                    {retailers.map((retailer) => (
                        <div
                            key={retailer.id}
                            className={styles.retailerCard}
                            onClick={() => handleRetailerSelect(retailer.id)}
                        >
                            <div className={styles.cardContent}>
                                <div className={styles.retailerIconContainer}>
                                    {retailer.shop_image ? (
                                        <img 
                                            src={getImageUrl(retailer.shop_image) || ''} 
                                            alt={retailer.shop_name} 
                                            className={styles.retailerImage} 
                                        />
                                    ) : (
                                        <div className={styles.retailerIconFallback}>
                                            <ShoppingBag size={28} color="#2563eb" />
                                        </div>
                                    )}
                                </div>
                                <div className={styles.retailerInfo}>
                                    <div className={styles.retailerHeader}>
                                        <h2>{retailer.shop_name}</h2>
                                    </div>

                                    {retailer.categories && retailer.categories.length > 0 ? (
                                        <div className={styles.categoriesWrapper}>
                                            {retailer.categories.map((cat: any) => (
                                                <span key={cat.id} className={styles.categoryBadge}>{cat.name}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.type}>{retailer.business_type}</p>
                                    )}

                                    <div className={styles.metaRow}>
                                        <span className={styles.metaItem}>
                                            <MapPin size={14} />
                                            {retailer.city}, {retailer.state}
                                        </span>
                                        <span className={styles.metaItem}>
                                            <Star size={14} className={styles.starIcon} />
                                            {retailer.average_rating}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.cardFooter}>
                                <div className={styles.tags}>
                                    {retailer.offers_delivery && (
                                        <span className={styles.tagDelivery}>● Delivery</span>
                                    )}
                                    {retailer.offers_pickup && (
                                        <span className={styles.tagPickup}>● Pickup</span>
                                    )}
                                </div>

                                <div className={styles.shopNowCTA}>
                                    Shop Now <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Retail Partner Banner */}
            <div className={styles.partnerBanner}>
                <div className={styles.partnerBannerContent}>
                    <h2>Grow Your Store With Order Easy</h2>
                    <p>Apni Dukaan Ko Online Banaiye</p>
                </div>
                <a
                    href="https://forms.gle/5e8PdMXTqVfK6os17"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.partnerBannerLink}
                >
                    Join us as Retail Partner
                </a>
            </div>
        </div>
    );
}
