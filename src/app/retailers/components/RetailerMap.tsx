'use client';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { GoogleMap, OverlayViewF, useJsApiLoader } from '@react-google-maps/api';
import { Home, MapPin } from 'lucide-react';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { offsetCenter, retailerPin, type LatLng, type MapRetailer } from '@/lib/retailerMap';
import styles from '../Retailers.module.css';

// Same loader options as MapPicker: the Google loader is a singleton and rejects a second configuration.
const libraries: ('places')[] = ['places'];
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const INDIA_CENTER: LatLng = { lat: 22.6, lng: 79.0 };

const MAP_STYLE: google.maps.MapTypeStyle[] = [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f1f4f9' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d9f2e1' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9defd' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fde9c4' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#7b879a' }] },
    { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#45526a' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
];

export interface MapInsets {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface RetailerMapHandle {
    /** Fit the customer's point and every plotted shop into the visible area. */
    fit: () => void;
    getCenter: () => LatLng | null;
    /** Centre on a point, keeping the current zoom unless it is too far out. */
    focus: (point: LatLng) => void;
}

interface RetailerMapProps {
    /** Shops to plot (already filtered); the ones without a pin are skipped. */
    retailers: MapRetailer[];
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    userPoint: LatLng | null;
    userKind: 'gps' | 'address' | 'pin' | null;
    /** "City, State" to centre on when neither the customer nor any shop has a pin. */
    cityQuery: string;
    /** Screen space covered by the top bar, sheet and side panel. */
    insets: MapInsets;
    /** Changes whenever the map should re-fit (new location or new shop list). */
    fitKey: string;
    pickMode: boolean;
    onPickCenter: (center: LatLng) => void;
    onStatus: (status: 'ready' | 'unavailable') => void;
}

const ZERO_OFFSET = () => ({ x: 0, y: 0 });

const RetailerMap = forwardRef<RetailerMapHandle, RetailerMapProps>(function RetailerMap(
    { retailers, selectedId, onSelect, userPoint, userKind, cityQuery, insets, fitKey, pickMode, onPickCenter, onStatus },
    ref
) {
    // Without a key Google shows an error dialog over the map, so only try keyless in local development.
    const canLoad = MAPS_KEY !== '' || process.env.NODE_ENV === 'development';
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: MAPS_KEY,
        libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [authFailed, setAuthFailed] = useState(false);
    const [panning, setPanning] = useState(false);
    const markerClickAt = useRef(0);
    const insetsRef = useRef(insets);
    insetsRef.current = insets;
    const stateRef = useRef({ retailers, userPoint, cityQuery });
    stateRef.current = { retailers, userPoint, cityQuery };

    const unavailable = !canLoad || !!loadError || authFailed;

    useEffect(() => {
        // Google calls this global when the key is rejected (wrong key, referrer or billing).
        const w = window as unknown as { gm_authFailure?: () => void };
        const previous = w.gm_authFailure;
        w.gm_authFailure = () => {
            setAuthFailed(true);
            previous?.();
        };
        return () => {
            w.gm_authFailure = previous;
        };
    }, []);

    useEffect(() => {
        if (unavailable) onStatus('unavailable');
        else if (map) onStatus('ready');
    }, [unavailable, map, onStatus]);

    const pins = useMemo(
        () =>
            retailers
                .map((r) => ({ retailer: r, pin: retailerPin(r) }))
                .filter((x): x is { retailer: MapRetailer; pin: LatLng } => x.pin !== null),
        [retailers]
    );

    const padding = useCallback((): google.maps.Padding => {
        const i = insetsRef.current;
        return { top: i.top + 66, bottom: i.bottom + 28, left: i.left + 36, right: i.right + 36 };
    }, []);

    const centerOn = useCallback((m: google.maps.Map, point: LatLng, zoom?: number) => {
        const i = insetsRef.current;
        const z = zoom ?? m.getZoom() ?? 14;
        if (zoom !== undefined) m.setZoom(zoom);
        // Keep the point in the middle of the area the sheet and top bar leave free.
        m.panTo(offsetCenter(point, (i.left - i.right) / 2, (i.top - i.bottom) / 2, z));
    }, []);

    const fit = useCallback(() => {
        if (!map) return;
        const { retailers: list, userPoint: user, cityQuery: city } = stateRef.current;
        const points = list.map(retailerPin).filter((p): p is LatLng => p !== null);
        if (user) points.push(user);

        if (points.length === 0) {
            if (!city) {
                map.setCenter(INDIA_CENTER);
                map.setZoom(5);
                return;
            }
            new google.maps.Geocoder()
                .geocode({ address: `${city}, India` })
                .then((res) => {
                    const hit = res.results[0]?.geometry;
                    if (!hit) return;
                    if (hit.viewport) map.fitBounds(hit.viewport, padding());
                    else centerOn(map, { lat: hit.location.lat(), lng: hit.location.lng() }, 12);
                })
                .catch(() => {
                    map.setCenter(INDIA_CENTER);
                    map.setZoom(5);
                });
            return;
        }

        if (points.length === 1) {
            centerOn(map, points[0], 15);
            return;
        }
        const bounds = new google.maps.LatLngBounds();
        points.forEach((p) => bounds.extend(p));
        // Cap the zoom for the fit so shops a few metres apart don't zoom to rooftops.
        map.setOptions({ maxZoom: 16 });
        map.fitBounds(bounds, padding());
        google.maps.event.addListenerOnce(map, 'idle', () => map.setOptions({ maxZoom: 20 }));
    }, [map, padding, centerOn]);

    const focus = useCallback((point: LatLng) => {
        if (!map) return;
        const zoom = map.getZoom() ?? 14;
        centerOn(map, point, zoom < 13 ? 15 : undefined);
    }, [map, centerOn]);

    useImperativeHandle(ref, () => ({
        fit,
        focus,
        getCenter: () => {
            const c = map?.getCenter();
            return c ? { lat: c.lat(), lng: c.lng() } : null;
        },
    }), [fit, focus, map]);

    // Re-fit when the location or the shop list changes (not on every search keystroke).
    useEffect(() => {
        if (map) fit();
    }, [map, fitKey, fit]);

    // Bring the selected shop into the free area of the screen.
    useEffect(() => {
        if (!map || selectedId === null) return;
        const hit = pins.find((p) => p.retailer.id === selectedId);
        if (hit) focus(hit.pin);
        // Only when the selection changes: re-running on every pin update would fight the user's panning.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, selectedId]);

    // Entering the pin picker: start from the customer's point so "confirm" works without panning.
    useEffect(() => {
        if (!map || !pickMode) return;
        if (stateRef.current.userPoint) {
            map.setZoom(Math.max(map.getZoom() ?? 15, 16));
            map.panTo(stateRef.current.userPoint);
        }
        const c = map.getCenter();
        if (c) onPickCenter({ lat: c.lat(), lng: c.lng() });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, pickMode]);

    const handleIdle = () => {
        setPanning(false);
        if (!pickMode || !map) return;
        const c = map.getCenter();
        if (c) onPickCenter({ lat: c.lat(), lng: c.lng() });
    };

    const handleMapClick = () => {
        // A tap on a marker also reaches the map; ignore it.
        if (Date.now() - markerClickAt.current < 250) return;
        if (!pickMode) onSelect(null);
    };

    if (unavailable) {
        return (
            <div className={styles.mapFallback} data-testid="retailer-map-unavailable" aria-hidden="true">
                <div className={styles.mapFallbackGrid} />
            </div>
        );
    }

    if (!isLoaded) {
        return <div className={`${styles.mapFallback} ${styles.mapLoading}`} aria-hidden="true"><div className={styles.mapFallbackGrid} /></div>;
    }

    return (
        <div className={`${styles.mapCanvas} ${pickMode ? styles.mapPicking : ''}`} data-testid="retailer-map">
            <GoogleMap
                mapContainerClassName={styles.mapInner}
                center={INDIA_CENTER}
                zoom={5}
                onLoad={setMap}
                onUnmount={() => setMap(null)}
                onClick={handleMapClick}
                onIdle={handleIdle}
                onDragStart={() => setPanning(true)}
                options={{
                    disableDefaultUI: true,
                    clickableIcons: false,
                    gestureHandling: 'greedy',
                    keyboardShortcuts: false,
                    minZoom: 4,
                    maxZoom: 20,
                    styles: MAP_STYLE,
                    backgroundColor: '#f1f4f9',
                }}
            >
                {userPoint && !pickMode && (
                    <OverlayViewF position={userPoint} mapPaneName="overlayLayer" getPixelPositionOffset={ZERO_OFFSET} zIndex={1}>
                        <div className={styles.anchor}>
                            {userKind === 'gps' ? (
                                <span className={styles.userDot} aria-label="Your location" role="img">
                                    <span className={styles.userDotPulse} />
                                    <span className={styles.userDotCore} />
                                </span>
                            ) : (
                                <span className={styles.userPin} aria-label="Your delivery location" role="img">
                                    {userKind === 'address' ? <Home size={15} strokeWidth={2.4} /> : <MapPin size={15} strokeWidth={2.4} />}
                                </span>
                            )}
                        </div>
                    </OverlayViewF>
                )}

                {!pickMode && pins.map(({ retailer, pin }, index) => {
                    const selected = retailer.id === selectedId;
                    const closed = retailer.is_currently_open === false;
                    const image = retailer.shop_image ? resolveMediaUrl(retailer.shop_image) : '';
                    return (
                        <OverlayViewF
                            key={retailer.id}
                            position={pin}
                            mapPaneName="overlayMouseTarget"
                            getPixelPositionOffset={ZERO_OFFSET}
                            zIndex={selected ? 1000 : closed ? 5 : 10}
                        >
                            <div className={styles.anchor} style={{ zIndex: selected ? 1000 : closed ? 5 : 10 }}>
                                <button
                                    type="button"
                                    className={`${styles.marker} ${selected ? styles.markerSelected : ''} ${closed ? styles.markerClosed : ''}`}
                                    style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markerClickAt.current = Date.now();
                                        onSelect(selected ? null : retailer.id);
                                    }}
                                    aria-label={`${retailer.shop_name}${closed ? ', closed' : ''}`}
                                    aria-pressed={selected}
                                    data-testid={`retailer-marker-${retailer.id}`}
                                >
                                    <span className={styles.markerBubble}>
                                        {image ? (
                                            <img src={image} alt="" className={styles.markerImage} />
                                        ) : (
                                            <span className={styles.markerInitial}>
                                                {retailer.shop_name?.charAt(0)?.toUpperCase() || '?'}
                                            </span>
                                        )}
                                    </span>
                                    <span className={styles.markerTail} aria-hidden="true" />
                                </button>
                            </div>
                        </OverlayViewF>
                    );
                })}
            </GoogleMap>

            {pickMode && (
                <div className={`${styles.pickPin} ${panning ? styles.pickPinLifted : ''}`} aria-hidden="true">
                    <span className={styles.pickPinHead}><MapPin size={20} strokeWidth={2.4} /></span>
                    <span className={styles.pickPinStem} />
                    <span className={styles.pickPinShadow} />
                </div>
            )}
        </div>
    );
});

export default RetailerMap;
