'use client';

import React, { useEffect, useState } from 'react';
import { Check, Crosshair, Home, Loader2, MapPin, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from '@/lib/toast';
import { INDIA_LOCATIONS, cityId } from '@/config/india-locations';
import type { City } from '@/config/cities';
import { requestCurrentPosition, reverseGeocode } from '@/utils/location';
import { addressLabel, addressToCenter, type MapCenter, type SavedAddress } from '@/utils/mapCenter';

interface LocationPickerSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    city: City | null;
    addresses: SavedAddress[];
    activeAddressId?: number;
    onApply: (result: { city: City; center: MapCenter | null }) => void;
}

const STATES = Object.keys(INDIA_LOCATIONS).sort();

/**
 * Changing where you are shopping from, without leaving the map.
 * Saved addresses are read-only here: editing still lives in /addresses so we
 * never silently write to a customer's address book.
 */
export function LocationPickerSheet({
    open,
    onOpenChange,
    city,
    addresses,
    activeAddressId,
    onApply,
}: LocationPickerSheetProps) {
    const router = useRouter();
    const [state, setState] = useState(city?.state ?? '');
    const [cityName, setCityName] = useState(city?.name ?? '');
    const [locating, setLocating] = useState(false);

    useEffect(() => {
        if (!open) return;
        setState(city?.state ?? '');
        setCityName(city?.name ?? '');
    }, [open, city?.state, city?.name]);

    const cityOptions = state ? (INDIA_LOCATIONS[state] ?? []) : [];

    const applyAddress = (address: SavedAddress) => {
        const center = addressToCenter(address);
        const nextCity: City = {
            id: cityId(address.city || '', address.state || ''),
            name: address.city || city?.name || '',
            state: address.state || city?.state || '',
            pincode: address.pincode,
        };
        if (!nextCity.name || !nextCity.state) {
            toast.error('That address is missing a city. Edit it to use it here.');
            return;
        }
        onApply({ city: nextCity, center });
        onOpenChange(false);
    };

    const useCurrentLocation = async () => {
        setLocating(true);
        try {
            const position = await requestCurrentPosition();
            if (!position) {
                toast.error('Could not get your location. Check location permission.');
                return;
            }
            const geo = await reverseGeocode(position.lat, position.lng);
            // Abort on geocode miss — never keep the previous city under new GPS coords
            // (that would leak shops from the wrong city on /retailers).
            const name = geo?.city;
            const geoState = geo?.state;
            if (!name || !geoState) {
                toast.error('Found your position but not your city. Pick it below.');
                return;
            }
            onApply({
                city: {
                    id: cityId(name, geoState),
                    name,
                    state: geoState,
                    pincode: geo?.pincode,
                },
                center: {
                    lat: position.lat,
                    lng: position.lng,
                    source: 'gps',
                    label: 'Current location',
                },
            });
            onOpenChange(false);
        } finally {
            setLocating(false);
        }
    };

    const applyCity = () => {
        if (!state || !cityName) return;
        onApply({
            city: { id: cityId(cityName, state), name: cityName, state },
            // Centre is re-derived from the city so the map follows the choice.
            center: null,
        });
        onOpenChange(false);
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[88vh]">
                <DrawerHeader className="shrink-0 text-left">
                    <DrawerTitle>Shopping from</DrawerTitle>
                    <DrawerDescription>
                        We use this to centre the map and find stores around you.
                    </DrawerDescription>
                </DrawerHeader>

                <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-8">
                    <button
                        type="button"
                        onClick={useCurrentLocation}
                        disabled={locating}
                        className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 text-left transition-colors hover:bg-primary/10 disabled:opacity-60"
                    >
                        <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                            {locating ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <Crosshair className="size-5" />
                            )}
                        </span>
                        <span>
                            <span className="block text-sm font-semibold text-foreground">
                                Use my current location
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                Most accurate for nearby stores
                            </span>
                        </span>
                    </button>

                    {addresses.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Saved addresses
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onOpenChange(false);
                                        router.push('/addresses');
                                    }}
                                    className="flex items-center gap-1 text-xs font-semibold text-primary"
                                >
                                    <Pencil className="size-3" />
                                    Manage
                                </button>
                            </div>

                            {addresses.map((address) => {
                                const isActive = address.id === activeAddressId;
                                const hasCoords = addressToCenter(address) !== null;
                                return (
                                    <button
                                        key={address.id}
                                        type="button"
                                        onClick={() => applyAddress(address)}
                                        className={cn(
                                            'flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                                            isActive
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border/60 hover:border-primary/40'
                                        )}
                                    >
                                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                            <Home className="size-4" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-foreground">
                                                    {addressLabel(address)}
                                                </span>
                                                {address.is_default && (
                                                    <Badge className="text-[10px]">Default</Badge>
                                                )}
                                                {!hasCoords && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        No pin
                                                    </Badge>
                                                )}
                                            </span>
                                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                                {address.full_address ||
                                                    `${address.address_line1 ?? ''}, ${address.city ?? ''}`}
                                            </span>
                                        </span>
                                        {isActive && <Check className="size-4 shrink-0 text-primary" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Or pick a city
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={state}
                                onChange={(event) => {
                                    setState(event.target.value);
                                    setCityName('');
                                }}
                                aria-label="State"
                                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring"
                            >
                                <option value="">State</option>
                                {STATES.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={cityName}
                                onChange={(event) => setCityName(event.target.value)}
                                disabled={!state}
                                aria-label="City"
                                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50"
                            >
                                <option value="">City</option>
                                {cityOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button
                            onClick={applyCity}
                            disabled={!state || !cityName}
                            className="w-full"
                        >
                            <MapPin className="size-4" />
                            Show stores here
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
