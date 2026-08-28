'use client';

import React from 'react';
import {
    ChevronDown,
    ChevronRight,
    ChevronUp,
    MapPinOff,
    ShoppingBag,
    Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistance, getRetailerLatLng, toDistance } from '@/utils/geo';
import type { RetailerSummary } from '@/types/retailer';

function imageUrl(path?: string | null) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://api.ordereasy.win${path.startsWith('/') ? '' : '/'}${path}`;
}

interface RetailerRowProps {
    retailer: RetailerSummary;
    isSelected: boolean;
    onSelect: (id: number) => void;
    onOpen: (id: number) => void;
}

export function RetailerRow({ retailer, isSelected, onSelect, onOpen }: RetailerRowProps) {
    const distance = formatDistance(retailer.distance);
    const image = imageUrl(retailer.shop_image);
    const rating = Number(retailer.average_rating ?? 0);
    // No distance can mean two very different things, and saying the wrong one
    // makes a perfectly mapped shop look broken.
    const hasPin = getRetailerLatLng(retailer) !== null;

    return (
        <div
            className={cn(
                'flex w-full items-center gap-2 rounded-2xl border p-3 transition-all duration-200',
                isSelected
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-border/60 bg-card hover:border-primary/40 hover:shadow-sm'
            )}
        >
            <button
                type="button"
                onClick={() => onSelect(retailer.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-primary/10">
                    {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={retailer.shop_name} className="size-full object-cover" />
                    ) : (
                        <div className="flex size-full items-center justify-center text-primary">
                            <ShoppingBag className="size-6" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground">
                            {retailer.shop_name}
                        </h3>
                        {retailer.is_currently_open === false && (
                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                                Closed
                            </Badge>
                        )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {distance && (
                            <span className="font-semibold text-primary">{distance} away</span>
                        )}
                        {!distance && !hasPin && (
                            <span className="flex items-center gap-1 font-medium">
                                <MapPinOff className="size-3" />
                                Location not shared
                            </span>
                        )}
                        {rating > 0 && (
                            <span className="flex items-center gap-1">
                                <Star className="size-3 fill-amber-400 text-amber-400" />
                                {rating.toFixed(1)}
                            </span>
                        )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {retailer.offers_delivery && (
                            <Badge className="text-[10px]">Delivery</Badge>
                        )}
                        {retailer.offers_pickup && (
                            <Badge variant="outline" className="text-[10px]">
                                Pickup
                            </Badge>
                        )}
                    </div>
                </div>
            </button>

            <button
                type="button"
                onClick={() => onOpen(retailer.id)}
                className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-transform active:scale-95"
            >
                Shop
                <ChevronRight className="size-3.5" />
            </button>
        </div>
    );
}

interface RetailerListPanelProps {
    retailers: RetailerSummary[];
    selectedId: number | null;
    expanded: boolean;
    onToggle: () => void;
    onSelect: (id: number) => void;
    onOpen: (id: number) => void;
    /** True when the map cannot render, so the list is the entire screen. */
    isOnlyView?: boolean;
}

/**
 * The distance-sorted fallback. It peeks above the bottom nav so the map keeps
 * the stage, and expands into a full list. When Maps is unavailable this is the
 * whole page, which is why it never depends on map state.
 */
export function RetailerListPanel({
    retailers,
    selectedId,
    expanded,
    onToggle,
    onSelect,
    onOpen,
    isOnlyView = false,
}: RetailerListPanelProps) {
    const nearest = retailers.find((r) => toDistance(r.distance) !== null);
    const nearestLabel = formatDistance(nearest?.distance);
    const offMapCount = retailers.filter((r) => getRetailerLatLng(r) === null).length;
    const orderLabel = nearestLabel
        ? `Nearest ${nearestLabel} away`
        : 'Set your location to sort by distance';

    return (
        <section
            className={cn(
                'z-30 flex flex-col overflow-hidden rounded-t-3xl border-t border-border/60 bg-card shadow-[0_-8px_30px_rgba(15,23,42,0.12)] transition-[max-height] duration-300 ease-out',
                isOnlyView ? 'max-h-full flex-1 rounded-t-none border-t-0 shadow-none' : '',
                !isOnlyView && (expanded ? 'max-h-[68vh]' : 'max-h-[118px]')
            )}
        >
            {!isOnlyView && (
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={expanded}
                    className="shrink-0 px-4 pt-2 pb-3 text-left"
                >
                    <span className="mx-auto mb-2.5 block h-1.5 w-10 rounded-full bg-muted-foreground/25" />
                    <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold text-foreground">
                                {retailers.length} {retailers.length === 1 ? 'store' : 'stores'} nearby
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {orderLabel}
                                {offMapCount > 0 ? ` · ${offMapCount} without a map pin` : ''}
                            </span>
                        </span>
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {expanded ? (
                                <ChevronDown className="size-4" />
                            ) : (
                                <ChevronUp className="size-4" />
                            )}
                        </span>
                    </span>
                </button>
            )}

            <div
                className={cn(
                    'custom-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pb-6',
                    !isOnlyView && !expanded && 'pointer-events-none opacity-0'
                )}
            >
                {isOnlyView && (
                    <p className="pt-4 pb-1 text-xs font-medium text-muted-foreground">
                        {nearestLabel ? 'Sorted nearest first' : orderLabel}
                        {offMapCount > 0 ? ` · ${offMapCount} without a map pin` : ''}
                    </p>
                )}
                {retailers.map((retailer) => (
                    <RetailerRow
                        key={retailer.id}
                        retailer={retailer}
                        isSelected={retailer.id === selectedId}
                        onSelect={onSelect}
                        onOpen={onOpen}
                    />
                ))}
            </div>
        </section>
    );
}
