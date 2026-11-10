'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Briefcase, Building2, Check, ChevronRight, Home, Loader2, LocateFixed, MapPin, MapPinned, Plus, X } from 'lucide-react';
import { addressLabel, addressLine, toLatLng, type ChosenLocation, type SavedAddress } from '@/lib/retailerMap';
import styles from '../Retailers.module.css';

interface LocationSheetProps {
    open: boolean;
    onClose: () => void;
    location: ChosenLocation | null;
    isAuthenticated: boolean;
    addresses: SavedAddress[];
    addressesLoading: boolean;
    /** GPS lookup in flight. */
    locating: boolean;
    /** GPS was refused or unavailable on the last try. */
    gpsDenied: boolean;
    canPickOnMap: boolean;
    onUseGps: () => void;
    onPickOnMap: () => void;
    onChooseAddress: (address: SavedAddress) => void;
    onChangeCity: () => void;
}

function AddressIcon({ address }: { address: SavedAddress }) {
    if (address.address_type === 'home') return <Home size={18} />;
    if (address.address_type === 'office') return <Briefcase size={18} />;
    return <MapPin size={18} />;
}

/** Modal sheet for choosing where the map is centred: GPS, a dropped pin, a saved address or another city. */
export default function LocationSheet({
    open, onClose, location, isAuthenticated, addresses, addressesLoading, locating, gpsDenied,
    canPickOnMap, onUseGps, onPickOnMap, onChooseAddress, onChangeCity,
}: LocationSheetProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        panelRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            previous?.focus?.();
        };
    }, [open, onClose]);

    if (!open) return null;

    const usingGps = location?.source === 'gps' && toLatLng(location.lat, location.lng) !== null;
    const usingPin = location?.source === 'pin';

    // Portalled to <body> so it covers the bottom navigation as well.
    return createPortal(
        <div className={styles.modalRoot}>
            <button type="button" className={styles.modalScrim} onClick={onClose} aria-label="Close" tabIndex={-1} />
            <div
                className={styles.modalPanel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="location-sheet-title"
                ref={panelRef}
                tabIndex={-1}
                data-testid="location-sheet"
            >
                <span className={styles.sheetHandle} aria-hidden="true" />
                <div className={styles.modalHeader}>
                    <div>
                        <h2 id="location-sheet-title" className={styles.modalTitle}>Where should we deliver?</h2>
                        <p className={styles.modalHint}>Stores, distances and delivery fees are shown for this spot.</p>
                    </div>
                    <button type="button" className={styles.iconButtonPlain} onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <button
                        type="button"
                        className={`${styles.option} ${usingGps ? styles.optionActive : ''}`}
                        onClick={onUseGps}
                        disabled={locating}
                        data-testid="location-use-gps"
                    >
                        <span className={`${styles.optionIcon} ${styles.optionIconBrand}`}>
                            {locating ? <Loader2 size={18} className={styles.spin} /> : <LocateFixed size={18} />}
                        </span>
                        <span className={styles.optionText}>
                            <span className={styles.optionTitle}>
                                {locating ? 'Finding you…' : 'Use my current location'}
                            </span>
                            <span className={styles.optionDetail}>
                                {usingGps && location?.address ? location.address : 'Uses your phone’s GPS'}
                            </span>
                        </span>
                        {usingGps ? <Check size={18} className={styles.optionCheck} /> : <ChevronRight size={18} className={styles.optionChevron} />}
                    </button>

                    {gpsDenied && (
                        <div className={styles.notice} role="alert" data-testid="location-gps-denied">
                            <strong>We couldn’t get your location.</strong>
                            <span>
                                Allow location access for Order Easy in your phone or browser settings and try again
                                {canPickOnMap ? ', or drop a pin on the map instead.' : ', or pick a saved address or city below.'}
                            </span>
                        </div>
                    )}

                    {canPickOnMap && (
                        <button
                            type="button"
                            className={`${styles.option} ${usingPin ? styles.optionActive : ''}`}
                            onClick={onPickOnMap}
                            data-testid="location-pick-on-map"
                        >
                            <span className={styles.optionIcon}><MapPinned size={18} /></span>
                            <span className={styles.optionText}>
                                <span className={styles.optionTitle}>Set location on the map</span>
                                <span className={styles.optionDetail}>
                                    {usingPin && location?.address ? location.address : 'Move the map and drop a pin'}
                                </span>
                            </span>
                            {usingPin ? <Check size={18} className={styles.optionCheck} /> : <ChevronRight size={18} className={styles.optionChevron} />}
                        </button>
                    )}

                    <h3 className={styles.modalSection}>Saved addresses</h3>

                    {!isAuthenticated && (
                        <Link href="/login" className={styles.option}>
                            <span className={styles.optionIcon}><Home size={18} /></span>
                            <span className={styles.optionText}>
                                <span className={styles.optionTitle}>Log in to use your addresses</span>
                                <span className={styles.optionDetail}>Home, work and other saved places</span>
                            </span>
                            <ChevronRight size={18} className={styles.optionChevron} />
                        </Link>
                    )}

                    {isAuthenticated && addressesLoading && (
                        <div className={styles.option} aria-hidden="true">
                            <span className={`oe-skeleton ${styles.optionIcon}`} />
                            <span className={styles.optionText}>
                                <span className="oe-skeleton" style={{ height: 14, width: '45%' }} />
                                <span className="oe-skeleton" style={{ height: 12, width: '75%', marginTop: 6 }} />
                            </span>
                        </div>
                    )}

                    {isAuthenticated && !addressesLoading && addresses.map((address) => {
                        const active = location?.source === 'address' && location.addressId === address.id;
                        const hasPin = toLatLng(address.latitude, address.longitude) !== null;
                        return (
                            <button
                                type="button"
                                key={address.id}
                                className={`${styles.option} ${active ? styles.optionActive : ''}`}
                                onClick={() => onChooseAddress(address)}
                                data-testid={`location-address-${address.id}`}
                            >
                                <span className={styles.optionIcon}><AddressIcon address={address} /></span>
                                <span className={styles.optionText}>
                                    <span className={styles.optionTitle}>
                                        {addressLabel(address)}
                                        {address.is_default && <span className={styles.badge}>Default</span>}
                                        {!hasPin && <span className={styles.badgeMuted}>No map pin</span>}
                                    </span>
                                    <span className={styles.optionDetail}>
                                        {addressLine(address)}{address.pincode ? ` ${address.pincode}` : ''}
                                    </span>
                                </span>
                                {active ? <Check size={18} className={styles.optionCheck} /> : <ChevronRight size={18} className={styles.optionChevron} />}
                            </button>
                        );
                    })}

                    {isAuthenticated && !addressesLoading && (
                        <Link href="/addresses/create" className={`${styles.option} ${styles.optionDashed}`}>
                            <span className={styles.optionIcon}><Plus size={18} /></span>
                            <span className={styles.optionText}>
                                <span className={styles.optionTitle}>Add a new address</span>
                                {addresses.length === 0 && (
                                    <span className={styles.optionDetail}>You have no saved addresses yet</span>
                                )}
                            </span>
                            <ChevronRight size={18} className={styles.optionChevron} />
                        </Link>
                    )}

                    <h3 className={styles.modalSection}>Somewhere else</h3>
                    <button type="button" className={styles.option} onClick={onChangeCity} data-testid="location-change-city">
                        <span className={styles.optionIcon}><Building2 size={18} /></span>
                        <span className={styles.optionText}>
                            <span className={styles.optionTitle}>Browse another city</span>
                            <span className={styles.optionDetail}>
                                {location ? `Now showing ${location.name}, ${location.state}` : 'Pick a state and city'}
                            </span>
                        </span>
                        <ChevronRight size={18} className={styles.optionChevron} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
