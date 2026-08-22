'use client';

import React from 'react';
import { MapPinOff, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RetailerSummary } from '@/types/retailer';

const VISIBLE_LIMIT = 3;

interface UnlocatedStoresRailProps {
    retailers: RetailerSummary[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    onShowAll: () => void;
}

/**
 * Shops the retailer never pinned (KAN-53) have no coordinates, so they cannot
 * be plotted. Rather than inventing a position, they ride the edge of the map
 * viewport where it is obvious they are off-map.
 */
export function UnlocatedStoresRail({
    retailers,
    selectedId,
    onSelect,
    onShowAll,
}: UnlocatedStoresRailProps) {
    if (retailers.length === 0) return null;

    const visible = retailers.slice(0, VISIBLE_LIMIT);
    const overflow = retailers.length - visible.length;

    return (
        // Narrow enough that the rail never covers the customer marker in the
        // middle of the map, whatever the phone width.
        <div className="pointer-events-none absolute top-[56%] right-0 z-20 flex w-[150px] max-w-[40%] -translate-y-1/2 flex-col items-end gap-2">
            <span className="pointer-events-none mr-2 flex items-center gap-1 rounded-full bg-foreground/75 px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
                <MapPinOff className="size-3" />
                No map pin
            </span>

            {visible.map((retailer) => (
                <button
                    key={retailer.id}
                    type="button"
                    onClick={() => onSelect(retailer.id)}
                    title={retailer.shop_name}
                    className={cn(
                        'pointer-events-auto flex w-full items-center gap-2 rounded-l-full border border-r-0 border-dashed py-2 pr-3 pl-3 text-left shadow-lg backdrop-blur transition-all duration-200 active:scale-95',
                        selectedId === retailer.id
                            ? 'border-primary bg-primary text-primary-foreground shadow-primary/30'
                            : 'border-primary/40 bg-white/90 text-foreground hover:bg-white'
                    )}
                >
                    <span
                        className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-full',
                            selectedId === retailer.id
                                ? 'bg-white/20 text-primary-foreground'
                                : 'bg-primary/10 text-primary'
                        )}
                    >
                        <Store className="size-3.5" />
                    </span>
                    <span className="truncate text-xs font-semibold">{retailer.shop_name}</span>
                </button>
            ))}

            {overflow > 0 && (
                <button
                    type="button"
                    onClick={onShowAll}
                    className="pointer-events-auto rounded-l-full border border-r-0 border-dashed border-primary/40 bg-white/90 py-1.5 pr-3 pl-3 text-xs font-semibold text-primary shadow-lg backdrop-blur transition-all active:scale-95"
                >
                    +{overflow} more off-map
                </button>
            )}
        </div>
    );
}
