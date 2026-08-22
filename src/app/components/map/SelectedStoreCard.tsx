'use client';

import React from 'react';
import { ChevronRight, MapPinOff, ShoppingBag, Star, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistance, getRetailerLatLng } from '@/utils/geo';
import type { RetailerSummary } from '@/types/retailer';

interface SelectedStoreCardProps {
    retailer: RetailerSummary;
    onOpen: (id: number) => void;
    onDismiss: () => void;
}

export function SelectedStoreCard({ retailer, onOpen, onDismiss }: SelectedStoreCardProps) {
    const distance = formatDistance(retailer.distance);
    const rating = Number(retailer.average_rating ?? 0);
    const hasPin = getRetailerLatLng(retailer) !== null;

    return (
        <div className="animate-fade-in pointer-events-auto mx-3 mb-2 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-xl shadow-black/10 backdrop-blur">
            <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShoppingBag className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                        {retailer.shop_name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {distance && (
                            <span className="font-semibold text-primary">{distance} away</span>
                        )}
                        {!distance && !hasPin && (
                            <span className="flex items-center gap-1">
                                <MapPinOff className="size-3" />
                                No map pin yet
                            </span>
                        )}
                        {rating > 0 && (
                            <span className="flex items-center gap-1">
                                <Star className="size-3 fill-amber-400 text-amber-400" />
                                {rating.toFixed(1)}
                            </span>
                        )}
                        {retailer.is_currently_open === false && (
                            <Badge variant="secondary" className="text-[10px]">
                                Closed
                            </Badge>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                    className="-mt-1 -mr-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                >
                    <X className="size-4" />
                </button>
            </div>

            <button
                type="button"
                onClick={() => onOpen(retailer.id)}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
            >
                Shop now
                <ChevronRight className="size-4" />
            </button>
        </div>
    );
}
