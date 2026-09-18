'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import {
    FulfillmentSlot,
    dayLabel,
    formatSlotTimeOnly,
    groupSlotsByDay,
} from '@/lib/fulfillmentSlots';

interface FulfillmentSlotPickerProps {
    retailerId: string;
    deliveryMode: 'pickup' | 'delivery';
    selectedSlotStart: string | null;
    onSelect: (slot: FulfillmentSlot | null) => void;
    days?: number;
    /** Bump to force refetch (e.g. after overbook error). */
    refreshKey?: number;
}

export default function FulfillmentSlotPicker({
    retailerId,
    deliveryMode,
    selectedSlotStart,
    onSelect,
    days = 7,
    refreshKey = 0,
}: FulfillmentSlotPickerProps) {
    const [slots, setSlots] = useState<FulfillmentSlot[]>([]);
    const [slotCapacity, setSlotCapacity] = useState<number | null>(null);
    const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await apiService.getFulfillmentSlots(
                    retailerId,
                    { delivery_mode: deliveryMode, days },
                    refreshKey > 0
                );
                if (cancelled) return;
                setSlots(data.slots ?? []);
                setSlotCapacity(data.slot_capacity ?? null);
                setTimezone(data.timezone ?? 'Asia/Kolkata');
            } catch (e) {
                if (cancelled) return;
                console.error(e);
                setError('Could not load available time slots. Please try again.');
                setSlots([]);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        if (retailerId) load();
        return () => { cancelled = true; };
    }, [retailerId, deliveryMode, days, refreshKey]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 size={16} className="animate-spin" />
                Loading available slots…
            </div>
        );
    }

    if (error) {
        return <p className="text-sm text-red-600 py-2">{error}</p>;
    }

    const available = slots.filter((s) => s.is_available);
    if (available.length === 0) {
        return (
            <p className="text-sm text-gray-500 py-2">
                No open {deliveryMode} slots in the next {days} day{days === 1 ? '' : 's'}. Try another order type or check back later.
            </p>
        );
    }

    const grouped = groupSlotsByDay(available);

    return (
        <div className="flex flex-col gap-4">
            {slotCapacity != null && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} />
                    30-min windows · up to {slotCapacity} orders per slot · {timezone}
                </p>
            )}
            {Array.from(grouped.entries()).map(([dayKey, daySlots]) => (
                <div key={dayKey}>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">{dayLabel(dayKey)}</p>
                    <div className="flex flex-wrap gap-2">
                        {daySlots.map((slot) => {
                            const isSelected = selectedSlotStart === slot.slot_start;
                            return (
                                <button
                                    key={slot.slot_start}
                                    type="button"
                                    onClick={() => onSelect(isSelected ? null : slot)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                                        isSelected
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {formatSlotTimeOnly(slot.slot_start_local)}
                                    <span className="ml-1 text-[10px] text-gray-400">
                                        ({slot.remaining} left)
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
