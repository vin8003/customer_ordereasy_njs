'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ArrowUpRight, ChevronDown, Loader2, LocateFixed, MapPin, MapPinned, Search, SearchX, Store, X,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { cityId } from '@/config/india-locations';
import {
    getPersistedLocation, hasConfirmedLocation, locationFromPoint, persistLocation, requestCurrentPosition,
    reverseGeocode, STORAGE_PINCODE, type GeoAddress, type StoredLocation,
} from '@/utils/location';
import { mergeRetailerChipFields } from '@/utils/retailerChips';
import { buildRetailerDiscoveryParams } from '@/lib/retailerDiscovery';
import {
    addressToLocation, filterRetailers, locationSummary, resolveStartLocation, RETAILER_FILTERS, sameCity,
    sortRetailers, splitByPin, toLatLng,
    type LatLng, type MapRetailer, type RetailerFilter, type SavedAddress, type SheetSnap,
} from '@/lib/retailerMap';
import BottomSheet from './components/BottomSheet';
import LocationSheet from './components/LocationSheet';
import PreviewCarousel from './components/PreviewCarousel';
import RetailerMap, { type MapInsets, type RetailerMapHandle } from './components/RetailerMap';
import RetailerRow from './components/RetailerRow';
import styles from './Retailers.module.css';

const RETAILER_BASE_URL = (process.env.NEXT_PUBLIC_RETAILER_PORTAL_URL || 'https://retailer.ordereasy.win').replace(/\/$/, '');
const RETAILER_LOGIN_URL = `${RETAILER_BASE_URL}/login`;

/** One request covers a city: the list endpoint allows up to 100 shops a page. */
const PAGE_SIZE = 100;
const GPS_TRIED_KEY = 'oe_map_gps_tried';
const DESKTOP_QUERY = '(min-width: 900px)';
const PANEL_WIDTH = 400;
const PEEK_HEIGHT = 84;

interface OperationalCity {
    city: string;
    state: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

function sameLocation(a: StoredLocation, b: StoredLocation): boolean {
    return a.id === b.id && a.lat === b.lat && a.lng === b.lng && a.pincode === b.pincode
        && a.source === b.source && a.addressId === b.addressId && a.address === b.address && a.label === b.label;
}

export default function RetailersPage() {
    const router = useRouter();
    const mapRef = useRef<RetailerMapHandle>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const topRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const fetchSeq = useRef(0);

    const [location, setLocation] = useState<StoredLocation | null>(null);
    const [retailers, setRetailers] = useState<MapRetailer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [operationalCities, setOperationalCities] = useState<OperationalCity[]>([]);
    const [loadingOpsCities, setLoadingOpsCities] = useState(false);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState('');
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    // Computed client-side only so the static export doesn't bake in the build-time hour.
    const [greeting, setGreeting] = useState('Hello');

    const [query, setQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [filters, setFilters] = useState<Set<RetailerFilter>>(new Set());
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [snap, setSnap] = useState<SheetSnap>('mid');

    const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
    const [locationSheetOpen, setLocationSheetOpen] = useState(false);
    const [locating, setLocating] = useState(false);
    const [gpsDenied, setGpsDenied] = useState(false);
    const [pickMode, setPickMode] = useState(false);
    const [pickCenter, setPickCenter] = useState<LatLng | null>(null);
    const [pickGeo, setPickGeo] = useState<GeoAddress | null>(null);
    const [pickLooking, setPickLooking] = useState(false);

    const [viewport, setViewport] = useState({ height: 0, top: 0, desktop: false });

    useEffect(() => {
        const h = new Date().getHours();
        setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    }, []);

    /* ---------- Layout measurements (sheet heights, map insets) ---------- */

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const media = window.matchMedia(DESKTOP_QUERY);
        const measure = () => {
            const top = topRef.current;
            setViewport((prev) => {
                const next = {
                    height: root.clientHeight,
                    top: top ? top.offsetTop + top.offsetHeight : prev.top,
                    desktop: media.matches,
                };
                return prev.height === next.height && prev.top === next.top && prev.desktop === next.desktop ? prev : next;
            });
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(root);
        if (topRef.current) observer.observe(topRef.current);
        media.addEventListener('change', measure);
        return () => {
            observer.disconnect();
            media.removeEventListener('change', measure);
        };
    }, []);

    const heights = useMemo<Record<SheetSnap, number>>(() => {
        const full = Math.max(PEEK_HEIGHT + 40, viewport.height - viewport.top - 10);
        const mid = Math.min(full, Math.max(PEEK_HEIGHT + 120, Math.round(viewport.height * 0.44)));
        return { peek: PEEK_HEIGHT, mid, full };
    }, [viewport.height, viewport.top]);

    /* ---------- Data ---------- */

    const fetchRetailers = useCallback(async (loc: StoredLocation) => {
        const seq = ++fetchSeq.current;
        setIsLoading(true);
        setError('');
        setOperationalCities([]);
        try {
            // With a pin, shops are listed by their delivery radius; without one, by city.
            const params = { ...buildRetailerDiscoveryParams(loc), page_size: String(PAGE_SIZE) };
            const data = await apiService.getRetailers(params);
            if (seq !== fetchSeq.current) return;
            const rows: MapRetailer[] = (Array.isArray(data) ? data : data.results || [])
                .map((row: MapRetailer) => mergeRetailerChipFields(row));
            setRetailers(rows);

            if (rows.length === 0) {
                setLoadingOpsCities(true);
                try {
                    const ops = await apiService.getOperationalCities();
                    if (seq === fetchSeq.current) setOperationalCities(ops.results || []);
                } catch (e) {
                    console.error('Failed to load operational cities', e);
                } finally {
                    if (seq === fetchSeq.current) setLoadingOpsCities(false);
                }
            }
        } catch (err) {
            if (seq !== fetchSeq.current) return;
            console.error(err);
            setRetailers([]);
            setError('Failed to load retailers. Please try again.');
        } finally {
            if (seq === fetchSeq.current) setIsLoading(false);
        }
    }, []);

    /** Make `loc` the active location: remember it, recentre the map and reload the shops. */
    const applyLocation = useCallback((loc: StoredLocation) => {
        persistLocation(loc);
        if (!loc.pincode) localStorage.removeItem(STORAGE_PINCODE);
        setLocation(loc);
        setSelectedId(null);
        fetchRetailers(loc);
    }, [fetchRetailers]);

    useEffect(() => {
        if (!hasConfirmedLocation()) return;
        const stored = getPersistedLocation();
        if (!stored?.name || !stored?.state) return;

        let cancelled = false;
        setLocation(stored);

        (async () => {
            let start = stored;
            if (apiService.isAuthenticated()) {
                setIsAuthenticated(true);
                setAddressesLoading(true);
                apiService.fetchUserProfile()
                    .then((profile) => { if (!cancelled) setUserName(profile.first_name || 'User'); })
                    .catch((e) => console.error('Profile fetch failed', e));
                // Saved addresses decide the map centre, so wait for them briefly before the first load.
                const list = await withTimeout<SavedAddress[] | null>(
                    apiService.getAddresses().then((d) => (Array.isArray(d) ? d : d?.results || [])).catch(() => null),
                    2500,
                    null
                );
                if (cancelled) return;
                setAddressesLoading(false);
                if (list) {
                    setAddresses(list);
                    start = resolveStartLocation(stored, list, cityId);
                }
            }

            if (!sameLocation(start, stored)) {
                persistLocation(start);
                setLocation(start);
            }
            fetchRetailers(start);

            // No pin from an address or an earlier GPS fix: ask the device once per visit.
            if (toLatLng(start.lat, start.lng) || sessionStorage.getItem(GPS_TRIED_KEY)) return;
            const pos = await requestCurrentPosition();
            sessionStorage.setItem(GPS_TRIED_KEY, '1');
            if (cancelled || !pos) return;
            const geo = await withTimeout(reverseGeocode(pos.lat, pos.lng), 6000, null);
            if (cancelled) return;
            // The customer chose this city by hand; a GPS fix somewhere else must not move them.
            if (geo?.city && !sameCity({ name: geo.city }, start)) return;
            const here = locationFromPoint(pos.lat, pos.lng, geo, start, { source: 'gps' });
            if (here) applyLocation(here);
        })();

        return () => {
            cancelled = true;
        };
    }, [fetchRetailers, applyLocation]);

    /* ---------- Derived lists ---------- */

    const visible = useMemo(
        () => sortRetailers(filterRetailers(retailers, query, filters)),
        [retailers, query, filters]
    );
    const mapReady = mapStatus === 'ready';
    const { pinned, unpinned } = useMemo(() => splitByPin(visible), [visible]);
    const allPinnedKey = useMemo(
        () => splitByPin(retailers).pinned.map((r) => r.id).join(','),
        [retailers]
    );

    const userPoint = useMemo(() => toLatLng(location?.lat, location?.lng), [location?.lat, location?.lng]);
    const userKind = !userPoint ? null : location?.source === 'address' ? 'address' : location?.source === 'pin' ? 'pin' : 'gps';
    const summary = locationSummary(location);
    const cityQuery = location ? `${location.name}, ${location.state}` : '';
    const fitKey = `${location?.id}|${location?.lat}|${location?.lng}|${allPinnedKey}`;
    const filtering = query.trim() !== '' || filters.size > 0;

    // A shop hidden by search or filters cannot stay selected.
    useEffect(() => {
        if (selectedId !== null && !pinned.some((r) => r.id === selectedId)) setSelectedId(null);
    }, [pinned, selectedId]);

    // With no map there is nothing behind the sheet, so open it fully.
    useEffect(() => {
        if (mapStatus === 'unavailable') {
            setSnap('full');
            setSelectedId(null);
            setPickMode(false);
        }
    }, [mapStatus]);

    useEffect(() => {
        if (selectedId === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedId(null);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [selectedId]);

    const showPreview = selectedId !== null && mapReady && !pickMode;

    const insets = useMemo<MapInsets>(() => {
        if (viewport.desktop) {
            return { top: 0, bottom: showPreview ? 210 : 0, left: pickMode ? 0 : PANEL_WIDTH + 16, right: 0 };
        }
        if (pickMode) return { top: 0, bottom: 0, left: 0, right: 0 };
        return { top: viewport.top, bottom: showPreview ? 230 : heights[snap], left: 0, right: 0 };
    }, [viewport.desktop, viewport.top, showPreview, pickMode, heights, snap]);

    /* ---------- Location choices ---------- */

    const handleUseGps = async () => {
        if (locating) return;
        setLocating(true);
        setGpsDenied(false);
        try {
            const pos = await requestCurrentPosition();
            if (!pos) {
                setGpsDenied(true);
                return;
            }
            const geo = await withTimeout(reverseGeocode(pos.lat, pos.lng), 6000, null);
            const here = locationFromPoint(pos.lat, pos.lng, geo, location, { source: 'gps', explicit: true });
            if (here) {
                applyLocation(here);
                setLocationSheetOpen(false);
            }
        } finally {
            setLocating(false);
        }
    };

    const handleChooseAddress = (address: SavedAddress) => {
        applyLocation(addressToLocation(address, true, cityId));
        setLocationSheetOpen(false);
    };

    const handleOperationalCitySelect = (ops: OperationalCity) => {
        applyLocation({ id: cityId(ops.city, ops.state), name: ops.city, state: ops.state, source: 'manual' });
    };

    const startPick = () => {
        setLocationSheetOpen(false);
        setSelectedId(null);
        setPickGeo(null);
        setPickCenter(null);
        setPickMode(true);
    };

    const handlePickCenter = useCallback((center: LatLng) => {
        setPickCenter((prev) => (prev && prev.lat === center.lat && prev.lng === center.lng ? prev : center));
    }, []);

    // Name the spot under the pin a moment after the map stops moving.
    useEffect(() => {
        if (!pickMode || !pickCenter) return;
        let cancelled = false;
        setPickLooking(true);
        const timer = setTimeout(async () => {
            const geo = await withTimeout(reverseGeocode(pickCenter.lat, pickCenter.lng), 6000, null);
            if (cancelled) return;
            setPickGeo(geo);
            setPickLooking(false);
        }, 350);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [pickMode, pickCenter]);

    const confirmPick = () => {
        const center = pickCenter || mapRef.current?.getCenter();
        if (!center) return;
        const picked = locationFromPoint(center.lat, center.lng, pickLooking ? null : pickGeo, location, {
            source: 'pin',
            label: 'Pinned location',
            explicit: true,
        });
        setPickMode(false);
        if (picked) applyLocation(picked);
    };

    /* ---------- Search and filters ---------- */

    const openSearch = () => {
        setSearchOpen(true);
        setSelectedId(null);
        if (!viewport.desktop && snap === 'peek') setSnap('mid');
        requestAnimationFrame(() => searchRef.current?.focus());
    };

    const closeSearch = () => {
        setSearchOpen(false);
        setQuery('');
    };

    const toggleFilter = (id: RetailerFilter) => {
        setFilters((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearFiltering = () => {
        setQuery('');
        setFilters(new Set());
    };

    const openRetailer = (id: number) => {
        router.push(`/retailer?id=${id}`);
    };

    const showOnMap = (id: number) => {
        setSelectedId(id);
    };

    /* ---------- Render ---------- */

    const storeWord = (n: number) => (n === 1 ? 'store' : 'stores');
    const sheetTitle = isLoading
        ? `Finding stores${location ? ` in ${location.name}` : ''}…`
        : error
            ? 'Couldn’t load stores'
            : retailers.length === 0
                ? 'No stores here yet'
            : filtering
                ? `${visible.length} of ${retailers.length} ${storeWord(retailers.length)}`
                : `${retailers.length} ${storeWord(retailers.length)} ${userPoint ? 'near you' : `in ${location?.name || 'your city'}`}`;
    const sheetSubtitle = isAuthenticated && userName
        ? `${greeting}, ${userName}. Pick a store to start shopping.`
        : `${greeting}. Pick a store to start shopping.`;

    const sheetHeader = (
        <div className={styles.sheetTitleRow}>
            <div className={styles.sheetTitleText}>
                <h1 className={styles.sheetTitle} aria-live="polite">{sheetTitle}</h1>
                <p className={styles.sheetSubtitle}>{sheetSubtitle}</p>
            </div>
            {mapReady && pinned.length > 0 && !isLoading && (
                <span className={styles.sheetCount}>
                    <MapPin size={12} /> {pinned.length} on map
                </span>
            )}
        </div>
    );

    const list = (
        <>
            {error && (
                <div className={styles.errorContainer} role="alert">
                    <p>{error}</p>
                    <Button onClick={() => location && fetchRetailers(location)} variant="outline" size="sm">Retry</Button>
                </div>
            )}

            {!error && !isLoading && location && !userPoint && retailers.length > 0 && (
                <button type="button" className={styles.nudge} onClick={() => setLocationSheetOpen(true)}>
                    <span className={styles.nudgeIcon}><LocateFixed size={18} /></span>
                    <span className={styles.nudgeText}>
                        <strong>Add your exact location</strong>
                        <span>See how far each store is and what delivery costs.</span>
                    </span>
                    <span className={styles.nudgeAction}>Set</span>
                </button>
            )}

            {isLoading && (
                <div className={styles.rows} aria-hidden="true">
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
            )}

            {!isLoading && !error && retailers.length === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><Store size={30} strokeWidth={1.75} /></div>
                    <h2>No stores here yet</h2>
                    <p>
                        {userPoint
                            ? 'No partner store delivers to this spot right now.'
                            : `We don't have partner stores in ${location?.name}${location?.state ? `, ${location.state}` : ''} right now.`}
                    </p>
                    {loadingOpsCities && <p className={styles.opsCitiesHint}>Loading cities we serve…</p>}
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
                    <Button variant="outline" onClick={() => setLocationSheetOpen(true)}>
                        Change location
                    </Button>
                </div>
            )}

            {!isLoading && retailers.length > 0 && visible.length === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><SearchX size={28} strokeWidth={1.75} /></div>
                    <h2>No stores match</h2>
                    <p>Try a different name or remove a filter.</p>
                    <Button variant="outline" onClick={clearFiltering}>Clear search and filters</Button>
                </div>
            )}

            {!isLoading && visible.length > 0 && (
                <>
                    {mapStatus === 'unavailable' && (
                        <p className={styles.sectionHint}>The map isn’t available right now, so here is every store as a list.</p>
                    )}

                    {pinned.length > 0 && (
                        <section className={styles.section} aria-label="Stores on the map">
                            {unpinned.length > 0 && mapReady && (
                                <div className={styles.sectionHeader}>
                                    <h2>On the map</h2>
                                    <span>{pinned.length}</span>
                                </div>
                            )}
                            <div className={styles.rows}>
                                {pinned.map((retailer, index) => (
                                    <RetailerRow
                                        key={retailer.id}
                                        retailer={retailer}
                                        index={index}
                                        onOpen={openRetailer}
                                        onShowOnMap={mapReady ? showOnMap : undefined}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {unpinned.length > 0 && (
                        <section className={styles.section} aria-label="Stores without a map pin">
                            {mapReady && (
                                <>
                                    <div className={styles.sectionHeader}>
                                        <h2>{pinned.length > 0 ? 'More stores' : 'Stores'} in {location?.name}</h2>
                                        <span>{unpinned.length}</span>
                                    </div>
                                    <p className={styles.sectionHint}>
                                        <MapPinned size={13} />
                                        {unpinned.length === 1 ? 'This store hasn’t' : 'These stores haven’t'} pinned
                                        {unpinned.length === 1 ? ' its' : ' their'} shop on the map yet.
                                    </p>
                                </>
                            )}
                            <div className={styles.rows}>
                                {unpinned.map((retailer, index) => (
                                    <RetailerRow
                                        key={retailer.id}
                                        retailer={retailer}
                                        index={pinned.length + index}
                                        onOpen={openRetailer}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}

            <div className={styles.partnerBanner}>
                <div className={styles.partnerBannerContent}>
                    <span className={styles.partnerEyebrow}>For shop owners</span>
                    <h2>Grow your store with Order Easy</h2>
                    <p>Apni Dukaan Ko Online Banaiye</p>
                </div>
                <a href={RETAILER_LOGIN_URL} target="_blank" rel="noopener noreferrer" className={styles.partnerBannerLink}>
                    Join as Retail Partner <ArrowUpRight size={16} />
                </a>
            </div>
        </>
    );

    const pickAddress = pickLooking
        ? 'Finding this spot…'
        : pickGeo?.address || (pickCenter ? `${pickCenter.lat.toFixed(5)}, ${pickCenter.lng.toFixed(5)}` : 'Move the map to choose a spot');

    return (
        <div
            ref={rootRef}
            className={`${styles.screen} ${pickMode ? styles.screenPicking : ''}`}
            style={{ '--map-bottom': `${insets.bottom}px`, '--panel-w': `${PANEL_WIDTH}px` } as React.CSSProperties}
        >
            <RetailerMap
                ref={mapRef}
                retailers={pinned}
                selectedId={selectedId}
                onSelect={setSelectedId}
                userPoint={userPoint}
                userKind={userKind}
                cityQuery={cityQuery}
                insets={insets}
                fitKey={fitKey}
                pickMode={pickMode}
                onPickCenter={handlePickCenter}
                onStatus={setMapStatus}
            />

            {/* Top bar: location, search, filters */}
            <div className={styles.top} ref={topRef}>
                <div className={styles.topRow}>
                    {searchOpen ? (
                        <div className={styles.searchBar} role="search">
                            <button type="button" className={styles.iconButtonPlain} onClick={closeSearch} aria-label="Close search">
                                <ArrowLeft size={18} />
                            </button>
                            <input
                                ref={searchRef}
                                type="search"
                                inputMode="search"
                                enterKeyHint="search"
                                className={styles.searchInput}
                                placeholder="Search stores or categories"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') closeSearch();
                                    if (e.key === 'Enter') e.currentTarget.blur();
                                }}
                                aria-label="Search stores"
                                data-testid="retailer-search"
                            />
                            {query && (
                                <button type="button" className={styles.iconButtonPlain} onClick={() => { setQuery(''); searchRef.current?.focus(); }} aria-label="Clear search">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                className={styles.locationBar}
                                onClick={() => { setGpsDenied(false); setLocationSheetOpen(true); }}
                                aria-label={`Change location. Now ${summary.title}${summary.detail ? `, ${summary.detail}` : ''}`}
                                data-testid="retailer-location-bar"
                            >
                                <span className={styles.locationIconWrap}><MapPin size={16} /></span>
                                <span className={styles.locationText}>
                                    <span className={styles.locationEyebrow}>
                                        {userPoint ? 'Delivering to' : 'Showing stores in'}
                                    </span>
                                    <span className={styles.locationLabel}>
                                        <span className={styles.locationTitle}>{summary.title}</span>
                                        {summary.detail && <span className={styles.locationDetail}>{summary.detail}</span>}
                                    </span>
                                </span>
                                <ChevronDown size={16} className={styles.locationChevron} />
                            </button>
                            <button type="button" className={styles.iconButton} onClick={openSearch} aria-label="Search stores" data-testid="retailer-search-open">
                                <Search size={18} />
                            </button>
                            {isAuthenticated ? (
                                <Link href="/profile" className={styles.avatar} aria-label="Your profile">
                                    {(userName || 'U').charAt(0).toUpperCase()}
                                </Link>
                            ) : (
                                <Link href="/login" className={styles.loginButton}>Log in</Link>
                            )}
                        </>
                    )}
                </div>
                <div className={`${styles.filterRow} no-scrollbar`} role="group" aria-label="Filter stores">
                    {RETAILER_FILTERS.map((f) => {
                        const active = filters.has(f.id);
                        return (
                            <button
                                type="button"
                                key={f.id}
                                className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
                                onClick={() => toggleFilter(f.id)}
                                aria-pressed={active}
                                data-testid={`retailer-filter-${f.id}`}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {mapReady && !pickMode && (
                <button
                    type="button"
                    className={styles.fab}
                    onClick={() => { setSelectedId(null); mapRef.current?.fit(); }}
                    aria-label="Recentre the map"
                    title="Recentre"
                    data-testid="retailer-recenter"
                >
                    <LocateFixed size={20} />
                </button>
            )}

            <BottomSheet
                snap={snap}
                onSnapChange={setSnap}
                heights={heights}
                hidden={(showPreview && !viewport.desktop) || pickMode}
                header={sheetHeader}
                label="Stores"
            >
                {list}
            </BottomSheet>

            {showPreview && selectedId !== null && (
                <PreviewCarousel
                    retailers={pinned}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onOpen={openRetailer}
                    onClose={() => setSelectedId(null)}
                />
            )}

            {pickMode && (
                <>
                    <div className={styles.pickTop}>
                        <button type="button" className={styles.iconButton} onClick={() => setPickMode(false)} aria-label="Cancel">
                            <ArrowLeft size={18} />
                        </button>
                        <span className={styles.pickHint}>Move the map to place the pin</span>
                    </div>
                    <div className={styles.pickPanel} data-testid="location-pick-panel">
                        <span className={styles.locationEyebrow}>Deliver here</span>
                        <p className={styles.pickAddress}>
                            {pickLooking && <Loader2 size={14} className={styles.spin} />}
                            {pickAddress}
                        </p>
                        <div className={styles.pickActions}>
                            <Button variant="outline" onClick={() => setPickMode(false)}>Cancel</Button>
                            <Button onClick={confirmPick} disabled={!pickCenter} data-testid="location-pick-confirm">
                                Confirm location
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <LocationSheet
                open={locationSheetOpen}
                onClose={() => setLocationSheetOpen(false)}
                location={location}
                isAuthenticated={isAuthenticated}
                addresses={addresses}
                addressesLoading={addressesLoading}
                locating={locating}
                gpsDenied={gpsDenied}
                canPickOnMap={mapReady}
                onUseGps={handleUseGps}
                onPickOnMap={startPick}
                onChooseAddress={handleChooseAddress}
                onChangeCity={() => router.push('/city-selection')}
            />
        </div>
    );
}
