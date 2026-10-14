'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, ShoppingBag, Star, ChevronRight, ChevronDown, Store, Bike, PackageCheck, ArrowUpRight } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import BrandLogo from '@/app/components/BrandLogo';
import { City } from '@/config/cities';
import { cityId } from '@/config/india-locations';
import { getPersistedLocation, hasConfirmedLocation } from '@/utils/location';
import { formatChipCurrency, mergeRetailerChipFields } from '@/utils/retailerChips';
import { resolveMediaUrl } from '@/utils/mediaUrl';
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
    is_currently_open?: boolean;
    minimum_order_amount?: number | string;
    delivery_charge?: number | string;
    free_delivery_threshold?: number | string;
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
    // Computed client-side only so the static export doesn't bake in the build-time hour.
    const [greeting, setGreeting] = useState('Hello');

    useEffect(() => {
        const h = new Date().getHours();
        setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    }, []);

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
            const results = (data.results || []).map((row: Retailer) => mergeRetailerChipFields(row));
            setRetailers(results);

            void Promise.all(
                results.map(async (row: Retailer) => {
                    try {
                        const details = await apiService.getRetailerDetails(String(row.id));
                        return mergeRetailerChipFields(row, details);
                    } catch {
                        return row;
                    }
                })
            ).then((enriched) => {
                setRetailers(enriched);
            });

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
        if (!hasConfirmedLocation()) {
            return;
        }

        const parsedCity = getPersistedLocation();
        if (!parsedCity?.name || !parsedCity?.state) {
            return;
        }

        setSelectedCity(parsedCity);
        fetchRetailers(parsedCity);

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


    const locationLabel = selectedCity
        ? selectedCity.pincode
            ? `${selectedCity.name} (${selectedCity.pincode})`
            : `${selectedCity.name}, ${selectedCity.state}`
        : 'Select city';


    const header = (
        <header className={styles.header}>
            <div className={styles.topBar}>
                <BrandLogo size="sm" />
                <div className={styles.authContainer}>
                    {isAuthenticated ? (
                        <Link href="/profile" className={styles.avatar} aria-label="Your profile">
                            {(userName || 'U').charAt(0).toUpperCase()}
                        </Link>
                    ) : (
                        <Link href="/login" className={styles.loginButton}>
                            Log in
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );

    const hero = (
        <section className={styles.hero}>
            <button
                type="button"
                className={styles.locationBar}
                onClick={() => router.push('/city-selection')}
                aria-label="Change location"
            >
                <span className={styles.locationIconWrap}>
                    <MapPin size={16} className={styles.locationIcon} />
                </span>
                <span className={styles.locationText}>
                    <span className={styles.locationEyebrow}>Delivering to</span>
                    <span className={styles.locationLabel}>
                        {locationLabel}
                        <ChevronDown size={16} />
                    </span>
                </span>
            </button>
            <h1 className={styles.heroTitle}>
                {isAuthenticated && userName ? `${greeting}, ${userName}` : greeting}
            </h1>
            <p className={styles.subtext}>Pick a store near you to start shopping</p>
        </section>
    );

    if (isLoading) {
        return (
            <div className={styles.container}>
                {header}
                <div className={styles.inner}>
                    {hero}
                    <p className={styles.loadingText}>
                        Finding stores in {selectedCity ? selectedCity.name : 'your area'}…
                    </p>
                    <div className={styles.retailerList}>
                        {[0, 1, 2].map((i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={`oe-skeleton ${styles.skeletonThumb}`} />
                                <div className={styles.skeletonLines}>
                                    <div className="oe-skeleton" style={{ height: 16, width: '60%' }} />
                                    <div className="oe-skeleton" style={{ height: 12, width: '40%' }} />
                                    <div className="oe-skeleton" style={{ height: 22, width: '80%', marginTop: 8 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {header}

            <div className={styles.inner}>
                {hero}

                {error && (
                    <div className={styles.errorContainer}>
                        <p>{error}</p>
                        <Button onClick={() => selectedCity && fetchRetailers(selectedCity)} variant="outline" size="sm">Retry</Button>
                    </div>
                )}

                {retailers.length === 0 && !error ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Store size={30} strokeWidth={1.75} />
                        </div>
                        <h2>No stores here yet</h2>
                        <p>
                            We don&apos;t have partner stores in {selectedCity?.name}
                            {selectedCity?.state ? `, ${selectedCity.state}` : ''} right now.
                        </p>
                        {loadingOpsCities && (
                            <p className={styles.opsCitiesHint}>Loading cities we serve…</p>
                        )}
                        {!loadingOpsCities && operationalCities.length > 0 && (
                            <div className={styles.opsCitiesBlock}>
                                <p className={styles.opsCitiesHint}>We currently serve these cities</p>
                                <div className={styles.opsCitiesList}>
                                    {operationalCities.map((ops) => (
                                        <button
                                            key={`${ops.state}-${ops.city}`}
                                            type="button"
                                            className={styles.opsCityChip}
                                            onClick={() => handleOperationalCitySelect(ops)}
                                        >
                                            <MapPin size={13} />
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
                    <>
                        {retailers.length > 0 && (
                            <div className={styles.listHeader}>
                                <h2>Stores near you</h2>
                                <span>{retailers.length} {retailers.length === 1 ? 'store' : 'stores'}</span>
                            </div>
                        )}
                        <div className={styles.retailerList}>
                            {retailers.map((retailer) => {
                                const isClosed = retailer.is_currently_open === false;
                                return (
                                    <button
                                        type="button"
                                        key={retailer.id}
                                        className={`${styles.retailerCard} ${isClosed ? styles.cardClosed : ''}`}
                                        onClick={() => handleRetailerSelect(retailer.id)}
                                    >
                                        <div className={styles.cardContent}>
                                            <div className={styles.retailerIconContainer}>
                                                {retailer.shop_image ? (
                                                    <img
                                                        src={resolveMediaUrl(retailer.shop_image) || ''}
                                                        alt={retailer.shop_name}
                                                        className={styles.retailerImage}
                                                    />
                                                ) : (
                                                    <div className={styles.retailerIconFallback}>
                                                        {retailer.shop_name?.charAt(0)?.toUpperCase() || <ShoppingBag size={26} />}
                                                    </div>
                                                )}
                                                {typeof retailer.is_currently_open === 'boolean' && (
                                                    <span
                                                        className={
                                                            retailer.is_currently_open
                                                                ? styles.chipOpen
                                                                : styles.chipClosed
                                                        }
                                                    >
                                                        {retailer.is_currently_open ? 'Open' : 'Closed'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.retailerInfo}>
                                                <div className={styles.retailerHeader}>
                                                    <h3>{retailer.shop_name}</h3>
                                                    {Number(retailer.average_rating) > 0 && (
                                                        <span className={styles.ratingPill}>
                                                            <Star size={11} className={styles.starIcon} />
                                                            {Number(retailer.average_rating).toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>

                                                {retailer.categories && retailer.categories.length > 0 ? (
                                                    <p className={styles.type}>
                                                        {retailer.categories.map((cat: any) => cat.name).join(' · ')}
                                                    </p>
                                                ) : (
                                                    <p className={styles.type}>{retailer.business_type}</p>
                                                )}

                                                <div className={styles.metaRow}>
                                                    <span className={styles.metaItem}>
                                                        <MapPin size={12} />
                                                        {retailer.city}, {retailer.state}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className={styles.cardChevron} />
                                        </div>

                                        <div className={styles.cardFooter}>
                                            <div className={styles.tags}>
                                                {retailer.offers_delivery && (
                                                    <span className={styles.tagDelivery}><Bike size={12} /> Delivery</span>
                                                )}
                                                {retailer.offers_pickup && (
                                                    <span className={styles.tagPickup}><PackageCheck size={12} /> Pickup</span>
                                                )}
                                                {formatChipCurrency(retailer.minimum_order_amount) && (
                                                    <span className={styles.chipInfo}>
                                                        Min {formatChipCurrency(retailer.minimum_order_amount)}
                                                    </span>
                                                )}
                                                {retailer.delivery_charge === 0 && (
                                                    <span className={styles.chipFree}>Free delivery</span>
                                                )}
                                                {formatChipCurrency(retailer.delivery_charge) && (
                                                    <span className={styles.chipInfo}>
                                                        Delivery {formatChipCurrency(retailer.delivery_charge)}
                                                    </span>
                                                )}
                                                {formatChipCurrency(retailer.free_delivery_threshold) && (
                                                    <span className={styles.chipInfo}>
                                                        Free above {formatChipCurrency(retailer.free_delivery_threshold)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                <div className={styles.partnerBanner}>
                    <div className={styles.partnerBannerContent}>
                        <span className={styles.partnerEyebrow}>For shop owners</span>
                        <h2>Grow your store with Order Easy</h2>
                        <p>Apni Dukaan Ko Online Banaiye</p>
                    </div>
                    <a
                        href="https://forms.gle/5e8PdMXTqVfK6os17"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.partnerBannerLink}
                    >
                        Join as Retail Partner <ArrowUpRight size={16} />
                    </a>
                </div>
            </div>
        </div>
    );
}
