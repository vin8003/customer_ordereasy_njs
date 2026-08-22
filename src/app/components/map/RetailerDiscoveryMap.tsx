'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, OverlayView, useJsApiLoader } from '@react-google-maps/api';
import { Crosshair, Loader2, Minus, Plus, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistance, zoomForNearest, type LatLng } from '@/utils/geo';
import type { PlottableRetailer, RetailerSummary } from '@/types/retailer';
import { DISCOVERY_MAP_STYLES } from './mapStyles';
import { UnlocatedStoresRail } from './UnlocatedStoresRail';

// Must match MapPicker: the Google loader rejects a second call with different options.
const LIBRARIES: 'places'[] = ['places'];
const LOADER_ID = 'google-map-script';

const NEAREST_IN_VIEW = 5;
const MAX_INITIAL_ZOOM = 16;
/** Keeps pins clear of the floating header, the zoom stack and the unlocated rail. */
const VIEW_PADDING = { top: 92, right: 168, bottom: 56, left: 40 };

interface RetailerDiscoveryMapProps {
    center: LatLng;
    centerLabel: string;
    located: PlottableRetailer[];
    unlocated: RetailerSummary[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    onShowAllUnlocated: () => void;
    /** Rendered instead of the map when Google Maps cannot load. */
    onUnavailable?: () => void;
}

export default function RetailerDiscoveryMap({
    center,
    centerLabel,
    located,
    unlocated,
    selectedId,
    onSelect,
    onShowAllUnlocated,
    onUnavailable,
}: RetailerDiscoveryMapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: LOADER_ID,
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES,
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    /** True once the customer has panned away from the framing we chose. */
    const hasPannedRef = useRef(false);
    const framedForRef = useRef('');
    const idleListenerRef = useRef<google.maps.MapsEventListener | null>(null);

    const initialZoom = useMemo(
        () => zoomForNearest(located.map((r) => r.distance ?? Number.NaN)),
        [located]
    );

    // Stable identity keeps the map from re-centring on every render and
    // fighting the user's panning.
    const centerLiteral = useMemo(
        () => ({ lat: center.lat, lng: center.lng }),
        [center.lat, center.lng]
    );

    /** The handful of shops the opening view has to prove are there. */
    const nearestFew = useMemo(
        () =>
            [...located]
                .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
                .slice(0, NEAREST_IN_VIEW),
        [located]
    );

    useEffect(() => {
        if (loadError) onUnavailable?.();
    }, [loadError, onUnavailable]);

    /**
     * Keep the customer in the middle. Only fit bounds when the nearest shops
     * sit outside that opening view — otherwise they get pushed to the edge.
     */
    const frameStores = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;
        hasPannedRef.current = false;

        if (idleListenerRef.current) {
            google.maps.event.removeListener(idleListenerRef.current);
            idleListenerRef.current = null;
        }

        const capZoom = () => {
            if ((map.getZoom() ?? 0) > MAX_INITIAL_ZOOM) map.setZoom(MAX_INITIAL_ZOOM);
        };

        map.setCenter(centerLiteral);
        map.setZoom(initialZoom);

        if (nearestFew.length === 0) return;

        idleListenerRef.current = google.maps.event.addListenerOnce(map, 'idle', () => {
            idleListenerRef.current = null;
            capZoom();
            const view = map.getBounds();
            const nearest = nearestFew[0];
            if (!view || !nearest) return;
            if (view.contains({ lat: nearest.lat, lng: nearest.lng })) return;

            const bounds = new google.maps.LatLngBounds();
            bounds.extend(centerLiteral);
            nearestFew.forEach((retailer) => {
                bounds.extend({ lat: retailer.lat, lng: retailer.lng });
            });
            map.fitBounds(bounds, VIEW_PADDING);
            idleListenerRef.current = google.maps.event.addListenerOnce(map, 'idle', () => {
                idleListenerRef.current = null;
                capZoom();
            });
        });
    }, [centerLiteral, initialZoom, nearestFew]);

    const handleLoad = useCallback(
        (map: google.maps.Map) => {
            mapRef.current = map;
            frameStores();
        },
        [frameStores]
    );

    const handleUnmount = useCallback(() => {
        if (idleListenerRef.current) {
            google.maps.event.removeListener(idleListenerRef.current);
            idleListenerRef.current = null;
        }
        mapRef.current = null;
    }, []);

    // Refit when the location or the store set changes, but never yank the map
    // back while the customer is panning around the same location.
    useEffect(() => {
        const key = `${centerLiteral.lat},${centerLiteral.lng}`;
        const movedLocation = framedForRef.current !== key;
        framedForRef.current = key;
        if (!movedLocation && hasPannedRef.current) return;
        frameStores();
    }, [centerLiteral, frameStores]);

    const handleDragEnd = useCallback(() => {
        hasPannedRef.current = true;
    }, []);

    const zoomBy = useCallback((delta: number) => {
        const map = mapRef.current;
        if (!map) return;
        map.setZoom((map.getZoom() ?? 13) + delta);
    }, []);

    if (loadError) return null;

    if (!isLoaded) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-muted/40">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    <span className="text-xs font-medium">Loading map…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full">
            <GoogleMap
                mapContainerClassName="h-full w-full"
                center={centerLiteral}
                zoom={initialZoom}
                onLoad={handleLoad}
                onUnmount={handleUnmount}
                onDragEnd={handleDragEnd}
                options={{
                    styles: DISCOVERY_MAP_STYLES,
                    disableDefaultUI: true,
                    gestureHandling: 'greedy',
                    clickableIcons: false,
                    maxZoom: 18,
                    minZoom: 5,
                }}
            >
                <OverlayView
                    position={centerLiteral}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={(width, height) => ({
                        x: -width / 2,
                        y: -height / 2,
                    })}
                >
                    <div className="relative flex size-16 items-center justify-center">
                        <span className="absolute size-16 animate-ping rounded-full bg-primary/20" />
                        <span className="absolute size-9 rounded-full bg-primary/25" />
                        <span className="relative size-4 rounded-full border-2 border-white bg-primary shadow-lg shadow-primary/40" />
                    </div>
                </OverlayView>

                {located.map((retailer) => {
                    const isSelected = retailer.id === selectedId;
                    return (
                        <OverlayView
                            key={retailer.id}
                            position={{ lat: retailer.lat, lng: retailer.lng }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                            getPixelPositionOffset={(width, height) => ({
                                x: -width / 2,
                                y: -height,
                            })}
                        >
                            <button
                                type="button"
                                onClick={() => onSelect(retailer.id)}
                                aria-label={retailer.shop_name}
                                className={cn(
                                    'group flex origin-bottom flex-col items-center transition-transform duration-200',
                                    isSelected ? 'z-30 scale-110' : 'z-10 hover:scale-105'
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex max-w-[8.5rem] items-center gap-1.5 rounded-full border py-1.5 pr-3 pl-2 text-xs font-semibold shadow-lg transition-colors',
                                        isSelected
                                            ? 'border-primary bg-primary text-primary-foreground shadow-primary/40'
                                            : 'border-border/60 bg-white text-foreground'
                                    )}
                                >
                                    <Store
                                        className={cn(
                                            'size-3.5 shrink-0',
                                            isSelected ? 'text-primary-foreground' : 'text-primary'
                                        )}
                                    />
                                    <span className="truncate">{retailer.shop_name}</span>
                                    {retailer.distance != null && (
                                        <span
                                            className={cn(
                                                'shrink-0 text-[10px] font-medium',
                                                isSelected
                                                    ? 'text-primary-foreground/80'
                                                    : 'text-muted-foreground'
                                            )}
                                        >
                                            {formatDistance(retailer.distance)}
                                        </span>
                                    )}
                                </span>
                                <span
                                    className={cn(
                                        'size-2 -translate-y-1 rotate-45 border-r border-b',
                                        isSelected
                                            ? 'border-primary bg-primary'
                                            : 'border-border/60 bg-white'
                                    )}
                                />
                            </button>
                        </OverlayView>
                    );
                })}
            </GoogleMap>

            <UnlocatedStoresRail
                retailers={unlocated}
                selectedId={selectedId}
                onSelect={onSelect}
                onShowAll={onShowAllUnlocated}
            />

            <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
                <div className="flex flex-col overflow-hidden rounded-full border border-border/60 bg-white/90 shadow-lg backdrop-blur">
                    <button
                        type="button"
                        onClick={() => zoomBy(1)}
                        aria-label="Zoom in"
                        className="p-2 text-foreground transition-colors hover:bg-primary/10 active:scale-95"
                    >
                        <Plus className="size-4" />
                    </button>
                    <span className="mx-auto h-px w-4 bg-border" />
                    <button
                        type="button"
                        onClick={() => zoomBy(-1)}
                        aria-label="Zoom out"
                        className="p-2 text-foreground transition-colors hover:bg-primary/10 active:scale-95"
                    >
                        <Minus className="size-4" />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={frameStores}
                    aria-label={`Recentre on ${centerLabel}`}
                    className="rounded-full border border-border/60 bg-white/90 p-2 text-foreground shadow-lg backdrop-blur transition-all hover:text-primary active:scale-95"
                >
                    <Crosshair className="size-4" />
                </button>
            </div>
        </div>
    );
}
