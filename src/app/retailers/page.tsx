'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, ShoppingBag, Star, ChevronRight } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { City } from '@/config/cities';
import { cityId } from '@/config/india-locations';
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

interface OperationalCity {
    city: string;
    state: string;
}

export default function RetailersPage() {
    const router = useRouter();
    const [retailers, setRetailers] = useState<Retailer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState('');
    const [operationalCities, setOperationalCities] = useState<OperationalCity[]>([]);
    const [loadingOpsCities, setLoadingOpsCities] = useState(false);

    const fetchRetailers = useCallback(async (city: City) => {
        setIsLoading(true);
        setError('');
        setOperationalCities([]);
        try {
            const params: Record<string, string> = {
                city: city.name,
                state: city.state,
            };
            const data = await apiService.getRetailers(params);
            const results = data.results || [];
            setRetailers(results);

            if (results.length === 0) {
                setLoadingOpsCities(true);
                try {
                    const ops = await apiService.getOperationalCities();
                    setOperationalCities(ops.results || []);
                } catch (e) {
                    console.error('Failed to load operational cities', e);
                } finally {
                    setLoadingOpsCities(false);
                }
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load retailers. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedCity = localStorage.getItem('selected_city');

        if (!storedCity) {
            router.replace('/city-selection');
            return;
        }

        try {
            const parsedCity: City = JSON.parse(storedCity);
            if (!parsedCity?.name || !parsedCity?.state) {
                router.replace('/city-selection');
                return;
            }
            setSelectedCity(parsedCity);
            fetchRetailers(parsedCity);
        } catch (e) {
            console.error(e);
            router.replace('/city-selection');
            return;
        }

        if (apiService.isAuthenticated()) {
            setIsAuthenticated(true);
            apiService.fetchUserProfile().then(profile => {
                setUserName(profile.first_name || 'User');
            }).catch(e => console.error('Profile fetch failed', e));
        }
    }, [fetchRetailers, router]);

    const handleOperationalCitySelect = (ops: OperationalCity) => {
        const city: City = {
            id: cityId(ops.city, ops.state),
            name: ops.city,
            state: ops.state,
        };
        localStorage.setItem('selected_city', JSON.stringify(city));
        localStorage.removeItem('selected_pincode');
        window.dispatchEvent(new Event('storage'));
        setSelectedCity(city);
        fetchRetailers(city);
    };

    const handleRetailerSelect = (id: number) => {
        router.push(`/retailer?id=${id}`);
    };

    const getImageUrl = (path?: string) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `https://api.ordereasy.win${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const locationLabel = selectedCity
        ? selectedCity.pincode
            ? `${selectedCity.name} (${selectedCity.pincode})`
            : `${selectedCity.name}, ${selectedCity.state}`
        : 'Select city';

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
                        <span>{locationLabel}</span>
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
                    <p>
                        No retailers found in {selectedCity?.name}
                        {selectedCity?.state ? `, ${selectedCity.state}` : ''}.
                    </p>
                    {loadingOpsCities && (
                        <p className={styles.opsCitiesHint}>Loading cities we serve…</p>
                    )}
                    {!loadingOpsCities && operationalCities.length > 0 && (
                        <div className={styles.opsCitiesBlock}>
                            <p className={styles.opsCitiesHint}>We currently serve these cities:</p>
                            <div className={styles.opsCitiesList}>
                                {operationalCities.map((ops) => (
                                    <button
                                        key={`${ops.state}-${ops.city}`}
                                        type="button"
                                        className={styles.opsCityChip}
                                        onClick={() => handleOperationalCitySelect(ops)}
                                    >
                                        {ops.city}, {ops.state}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {!loadingOpsCities && operationalCities.length === 0 && (
                        <Button
                            variant="outline"
                            onClick={() => router.push('/city-selection')}
                        >
                            Change city
                        </Button>
                    )}
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
