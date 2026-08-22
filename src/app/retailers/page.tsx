'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2, MapPin, ShoppingBag } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/app/components/EmptyState';
import { City } from '@/config/cities';
import { cityId } from '@/config/india-locations';
import { cn } from '@/lib/utils';
import { getPersistedLocation, persistLocation } from '@/utils/location';
import { partitionByLocation, sortByDistance, type LatLng } from '@/utils/geo';
import {
    cityCenter,
    loadSavedAddresses,
    resolveMapCenter,
    type MapCenter,
    type SavedAddress,
} from '@/utils/mapCenter';
import { isMapConfigured } from '@/utils/mapConfig';
import type { RetailerSummary } from '@/types/retailer';
import { RetailerListPanel } from '@/app/components/map/RetailerListPanel';
import { SelectedStoreCard } from '@/app/components/map/SelectedStoreCard';
import { LocationPickerSheet } from '@/app/components/map/LocationPickerSheet';

// Google Maps must not run during the static export prerender.
const RetailerDiscoveryMap = dynamic(
    () => import('@/app/components/map/RetailerDiscoveryMap'),
    { ssr: false }
);

interface OperationalCity {
    city: string;
    state: string;
}

function samePoint(a: LatLng | null, b: LatLng | null) {
    if (!a && !b) return true;
    return Boolean(
        a && b && Math.abs(a.lat - b.lat) < 1e-5 && Math.abs(a.lng - b.lng) < 1e-5
    );
}

export default function RetailersPage() {
    const router = useRouter();
    const [retailers, setRetailers] = useState<RetailerSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [center, setCenter] = useState<MapCenter | null>(null);
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState('');
    const [operationalCities, setOperationalCities] = useState<OperationalCity[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [listExpanded, setListExpanded] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [mapBroken, setMapBroken] = useState(false);
    const fetchGen = useRef(0);

    const fetchRetailers = useCallback(async (city: City, at: LatLng | null) => {
        const gen = ++fetchGen.current;
        setIsLoading(true);
        setError('');
        setOperationalCities([]);

        const listParams = (coords: LatLng | null) => ({
            city: city.name,
            state: city.state,
            ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
            filter_by_radius: 'false' as const,
            page_size: 100,
        });

        try {
            let data = await apiService.getRetailers(listParams(at));
            if (gen !== fetchGen.current) return;
            let results: RetailerSummary[] = data.results || [];

            // Deployed list API still drops unlocated shops when lat/lng are sent
            // (filter_by_radius is ignored until KAN-69 is live). That empty
            // payload means "none in range", not "this city has no stores".
            if (results.length === 0 && at) {
                data = await apiService.getRetailers(listParams(null));
                if (gen !== fetchGen.current) return;
                results = data.results || [];
            }

            setRetailers(results);

            if (results.length === 0) {
                try {
                    const ops = await apiService.getOperationalCities();
                    if (gen !== fetchGen.current) return;
                    setOperationalCities(ops.results || []);
                } catch (e) {
                    console.error('Failed to load operational cities', e);
                }
            }
        } catch (err) {
            console.error(err);
            if (gen !== fetchGen.current) return;
            setError('Failed to load retailers. Please try again.');
        } finally {
            if (gen === fetchGen.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedCity = localStorage.getItem('selected_city');
        if (!storedCity) {
            router.replace('/city-selection');
            return;
        }

        let city: City;
        try {
            city = JSON.parse(storedCity);
        } catch (e) {
            console.error(e);
            router.replace('/city-selection');
            return;
        }
        if (!city?.name || !city?.state) {
            router.replace('/city-selection');
            return;
        }

        setSelectedCity(city);

        const authed = apiService.isAuthenticated();
        setIsAuthenticated(authed);
        if (authed) {
            apiService
                .fetchUserProfile()
                .then((profile) => setUserName(profile.first_name || 'there'))
                .catch((e) => console.error('Profile fetch failed', e));
        }

        (async () => {
            const persisted = getPersistedLocation();
            const persistedAt: LatLng | null =
                persisted &&
                persisted.name === city.name &&
                persisted.state === city.state &&
                Number.isFinite(persisted.lat) &&
                Number.isFinite(persisted.lng)
                    ? { lat: persisted.lat as number, lng: persisted.lng as number }
                    : null;

            // List fetch does not wait on city geocode (up to ~8s).
            void fetchRetailers(city, persistedAt);

            const saved = await loadSavedAddresses();
            setAddresses(saved);
            const resolved = await resolveMapCenter(city, saved);
            setCenter(resolved);
            if (!samePoint(persistedAt, resolved)) {
                await fetchRetailers(city, resolved);
            }
        })();
    }, [fetchRetailers, router]);

    const applyLocation = useCallback(
        async ({ city, center: nextCenter }: { city: City; center: MapCenter | null }) => {
            setSelectedCity(city);
            setSelectedId(null);
            // Resolving a centre can take a geocode round trip. Drop the old
            // city's stores now so we never show them against the new centre.
            setRetailers([]);
            setIsLoading(true);

            // Picking a city means "show me this city", so it centres there
            // rather than on a saved address that may be somewhere else.
            const resolved = nextCenter ?? (await cityCenter(city));
            persistLocation({
                ...city,
                lat: resolved?.lat,
                lng: resolved?.lng,
                addressId: resolved?.addressId,
                source: resolved?.source ?? 'manual',
            });
            setCenter(resolved);
            await fetchRetailers(city, resolved);
        },
        [fetchRetailers]
    );

    const handleOperationalCitySelect = (ops: OperationalCity) => {
        applyLocation({
            city: { id: cityId(ops.city, ops.state), name: ops.city, state: ops.state },
            center: null,
        });
    };

    const openRetailer = useCallback(
        (id: number) => {
            router.push(`/retailer?id=${id}`);
        },
        [router]
    );

    const { located, unlocated } = useMemo(
        () => partitionByLocation(retailers, center),
        [retailers, center]
    );

    const sorted = useMemo(
        () => sortByDistance<RetailerSummary>([...located, ...unlocated]),
        [located, unlocated]
    );

    const selectedRetailer = useMemo(
        () => sorted.find((r) => r.id === selectedId) ?? null,
        [sorted, selectedId]
    );

    const showMap = isMapConfigured() && !mapBroken && center !== null;

    const locationLabel = center?.source === 'address' ? center.label : selectedCity?.name ?? 'Set location';
    const locationSubLabel =
        center?.source === 'address'
            ? `${selectedCity?.name ?? ''}${selectedCity?.state ? `, ${selectedCity.state}` : ''}`
            : center?.source === 'gps'
              ? 'Current location'
              : selectedCity?.state ?? '';

    const hasStores = sorted.length > 0;
    const showFetchError = Boolean(error) && !hasStores;
    const showEmptyCity = !isLoading && !error && !hasStores;

    if (!selectedCity) {
        return (
            <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-6">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                    Finding stores in your area…
                </p>
            </div>
        );
    }

    const header = (
        <header className="pointer-events-auto flex items-center gap-2 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
            <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border/60 bg-card/95 px-3 py-2.5 text-left shadow-lg shadow-black/5 backdrop-blur transition-colors hover:border-primary/40"
            >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                        Shopping from
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="truncate text-sm font-semibold text-foreground">
                            {locationLabel}
                        </span>
                        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                    </span>
                </span>
                {locationSubLabel && (
                    <span className="hidden max-w-[35%] truncate text-xs text-muted-foreground sm:block">
                        {locationSubLabel}
                    </span>
                )}
            </button>

            {isAuthenticated ? (
                <span className="shrink-0 rounded-2xl border border-border/60 bg-card/95 px-3 py-2.5 text-sm font-semibold text-foreground shadow-lg shadow-black/5 backdrop-blur">
                    Hi, {userName || 'there'}
                </span>
            ) : (
                <Button
                    asChild
                    variant="outline"
                    className="h-[46px] shrink-0 rounded-2xl bg-card/95 backdrop-blur"
                >
                    <Link href="/login">Login</Link>
                </Button>
            )}
        </header>
    );

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-background pb-[calc(64px+env(safe-area-inset-bottom))]">
            {showMap && center ? (
                // Everything floats over a full-bleed map: expanding the list
                // must not resize the map underneath it.
                <div className="relative min-h-0 flex-1">
                    {/* The map stops where the collapsed list starts so Google's
                        attribution stays visible and expanding never resizes it. */}
                    <div
                        className={cn(
                            'absolute inset-x-0 top-0',
                            hasStores ? 'bottom-[118px]' : 'bottom-0'
                        )}
                    >
                        <RetailerDiscoveryMap
                            center={center}
                            centerLabel={center.label}
                            located={located}
                            unlocated={unlocated}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onShowAllUnlocated={() => setListExpanded(true)}
                            onUnavailable={() => setMapBroken(true)}
                        />
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
                        {header}
                    </div>

                    {isLoading && !hasStores && (
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/95 px-4 py-3 text-sm font-medium text-muted-foreground shadow-lg backdrop-blur">
                                <Loader2 className="size-4 animate-spin text-primary" />
                                Finding stores in {selectedCity.name}…
                            </div>
                        </div>
                    )}

                    {showFetchError && (
                        <div className="pointer-events-auto absolute inset-x-4 top-1/2 z-20 -translate-y-1/2 rounded-2xl border border-destructive/30 bg-card/95 p-4 shadow-lg backdrop-blur">
                            <p className="text-sm text-destructive">{error}</p>
                            <Button
                                className="mt-3"
                                variant="outline"
                                onClick={() => fetchRetailers(selectedCity, center)}
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {showEmptyCity && (
                        <div className="pointer-events-auto absolute inset-x-4 top-1/2 z-20 -translate-y-1/2">
                            <EmptyState
                                icon={ShoppingBag}
                                title={`No stores in ${selectedCity.name} yet`}
                                description={
                                    operationalCities.length > 0
                                        ? 'We are live in these cities — tap one to switch.'
                                        : 'Try a different city while we onboard more shops here.'
                                }
                                actionLabel={operationalCities.length > 0 ? undefined : 'Change city'}
                                onAction={
                                    operationalCities.length > 0 ? undefined : () => setSheetOpen(true)
                                }
                                className="bg-card/95 backdrop-blur"
                            />
                            {operationalCities.length > 0 && (
                                <div className="mt-3 flex flex-wrap justify-center gap-2">
                                    {operationalCities.map((ops) => (
                                        <button
                                            key={`${ops.state}-${ops.city}`}
                                            type="button"
                                            onClick={() => handleOperationalCitySelect(ops)}
                                            className="rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition-transform active:scale-95"
                                        >
                                            {ops.city}, {ops.state}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedRetailer && !listExpanded && (
                        <div className="absolute inset-x-0 bottom-[118px] z-30">
                            <SelectedStoreCard
                                retailer={selectedRetailer}
                                onOpen={openRetailer}
                                onDismiss={() => setSelectedId(null)}
                            />
                        </div>
                    )}

                    {hasStores && (
                        <div className="absolute inset-x-0 bottom-0 z-30">
                            <RetailerListPanel
                                retailers={sorted}
                                selectedId={selectedId}
                                expanded={listExpanded}
                                onToggle={() => setListExpanded((value) => !value)}
                                onSelect={setSelectedId}
                                onOpen={openRetailer}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                    {header}
                    {showFetchError && (
                        <div className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
                            <p className="text-sm text-destructive">{error}</p>
                            <Button
                                variant="outline"
                                onClick={() => fetchRetailers(selectedCity, center)}
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {isLoading && !hasStores && !error && (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
                            <Loader2 className="size-6 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Finding stores in {selectedCity.name}…
                            </p>
                        </div>
                    )}

                    {hasStores ? (
                        <RetailerListPanel
                            retailers={sorted}
                            selectedId={selectedId}
                            expanded
                            onToggle={() => undefined}
                            onSelect={setSelectedId}
                            onOpen={openRetailer}
                            isOnlyView
                        />
                    ) : showEmptyCity ? (
                        <div className="px-4 pt-6">
                            <EmptyState
                                icon={ShoppingBag}
                                title={`No stores in ${selectedCity.name} yet`}
                                description="Pick another city and we will show what is open around you."
                                actionLabel="Change location"
                                onAction={() => setSheetOpen(true)}
                            />
                            {operationalCities.length > 0 && (
                                <div className="mt-3 flex flex-wrap justify-center gap-2">
                                    {operationalCities.map((ops) => (
                                        <button
                                            key={`${ops.state}-${ops.city}`}
                                            type="button"
                                            onClick={() => handleOperationalCitySelect(ops)}
                                            className="rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition-transform active:scale-95"
                                        >
                                            {ops.city}, {ops.state}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            )}

            <LocationPickerSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                city={selectedCity}
                addresses={addresses}
                activeAddressId={center?.addressId}
                onApply={applyLocation}
            />
        </div>
    );
}
