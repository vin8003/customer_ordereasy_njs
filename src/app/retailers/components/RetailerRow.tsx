'use client';

import React from 'react';
import { Bike, ChevronRight, MapPin, Navigation, PackageCheck, Star } from 'lucide-react';
import { formatChipCurrency } from '@/utils/retailerChips';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { deliveryFeeChip } from '@/lib/retailerDiscovery';
import { formatDistanceKm } from '@/lib/deliveryQuote';
import type { MapRetailer } from '@/lib/retailerMap';
import styles from '../Retailers.module.css';

export function RetailerThumb({ retailer, size = 'md' }: { retailer: MapRetailer; size?: 'md' | 'lg' }) {
    const src = retailer.shop_image ? resolveMediaUrl(retailer.shop_image) : '';
    return (
        <div className={`${styles.thumb} ${size === 'lg' ? styles.thumbLg : ''}`}>
            {src ? (
                <img src={src} alt="" className={styles.thumbImage} loading="lazy" />
            ) : (
                <div className={styles.thumbFallback} aria-hidden="true">
                    {retailer.shop_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
            )}
        </div>
    );
}

export function OpenChip({ retailer }: { retailer: MapRetailer }) {
    if (typeof retailer.is_currently_open !== 'boolean') return null;
    return (
        <span className={retailer.is_currently_open ? styles.chipOpen : styles.chipClosed}>
            <span className={styles.statusDot} aria-hidden="true" />
            {retailer.is_currently_open ? 'Open' : 'Closed'}
        </span>
    );
}

export function retailerSubtitle(retailer: MapRetailer): string {
    if (retailer.categories && retailer.categories.length > 0) {
        return retailer.categories.map((c) => c.name).join(' · ');
    }
    return retailer.business_type || '';
}

/** Delivery, pickup, minimum order and fee chips shared by the list row and the map preview. */
export function RetailerChips({ retailer }: { retailer: MapRetailer }) {
    const feeChip = deliveryFeeChip(retailer);
    return (
        <div className={styles.tags}>
            {retailer.offers_delivery && (
                <span className={styles.tagDelivery}><Bike size={12} /> Delivery</span>
            )}
            {retailer.offers_pickup && (
                <span className={styles.tagPickup}><PackageCheck size={12} /> Pickup</span>
            )}
            {formatChipCurrency(retailer.minimum_order_amount) && (
                <span className={styles.chipInfo}>Min {formatChipCurrency(retailer.minimum_order_amount)}</span>
            )}
            {feeChip ? (
                <span className={feeChip === 'Free delivery' ? styles.chipFree : styles.chipInfo}>{feeChip}</span>
            ) : (
                <>
                    {retailer.offers_delivery && retailer.delivery_charge === 0 && (
                        <span className={styles.chipFree}>Free delivery</span>
                    )}
                    {formatChipCurrency(retailer.delivery_charge) && (
                        <span className={styles.chipInfo}>Delivery {formatChipCurrency(retailer.delivery_charge)}</span>
                    )}
                </>
            )}
            {formatChipCurrency(retailer.free_delivery_threshold) && (
                <span className={styles.chipInfo}>Free above {formatChipCurrency(retailer.free_delivery_threshold)}</span>
            )}
        </div>
    );
}

export function RatingPill({ retailer }: { retailer: MapRetailer }) {
    if (!(Number(retailer.average_rating) > 0)) return null;
    return (
        <span className={styles.ratingPill}>
            <Star size={11} className={styles.starIcon} />
            {Number(retailer.average_rating).toFixed(1)}
        </span>
    );
}

interface RetailerRowProps {
    retailer: MapRetailer;
    index: number;
    onOpen: (id: number) => void;
    /** Present for shops that have a pin: focuses the shop on the map. */
    onShowOnMap?: (id: number) => void;
}

export default function RetailerRow({ retailer, index, onOpen, onShowOnMap }: RetailerRowProps) {
    const isClosed = retailer.is_currently_open === false;
    const distance = formatDistanceKm(retailer.distance);
    const subtitle = retailerSubtitle(retailer);
    const place = [retailer.city, retailer.state].filter(Boolean).join(', ');
    return (
        <div
            className={`${styles.row} ${isClosed ? styles.rowClosed : ''}`}
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            data-testid={`retailer-card-${retailer.id}`}
        >
            <button type="button" className={styles.rowMain} onClick={() => onOpen(retailer.id)}>
                <RetailerThumb retailer={retailer} />
                <span className={styles.rowInfo}>
                    <span className={styles.rowTitleLine}>
                        <span className={styles.rowTitle}>{retailer.shop_name}</span>
                        <RatingPill retailer={retailer} />
                    </span>
                    {subtitle && <span className={styles.rowSubtitle}>{subtitle}</span>}
                    <span className={styles.rowMeta}>
                        <OpenChip retailer={retailer} />
                        {(distance || place) && (
                            <span className={styles.metaItem}>
                                <MapPin size={12} />
                                {distance ? `${distance} away` : place}
                            </span>
                        )}
                    </span>
                    <RetailerChips retailer={retailer} />
                </span>
                {!onShowOnMap && <ChevronRight size={18} className={styles.rowChevron} aria-hidden="true" />}
            </button>
            {onShowOnMap && (
                <button
                    type="button"
                    className={styles.rowMapButton}
                    onClick={() => onShowOnMap(retailer.id)}
                    aria-label={`Show ${retailer.shop_name} on the map`}
                    title="Show on map"
                >
                    <Navigation size={16} />
                </button>
            )}
        </div>
    );
}
