'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Clock, Loader2, Check, Sun, Sunset, Sunrise, Calendar } from 'lucide-react';
import { apiService } from '@/services/api';
import {
    FulfillmentSlot,
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
    /** Tells the page whether any slot is open, so checkout is not blocked when none exist. */
    onLoaded?: (state: { openSlots: number; failed: boolean }) => void;
}

type Period = 'morning' | 'afternoon' | 'evening';

const PERIOD_CONFIG: Record<Period, { label: string; icon: React.ReactNode }> = {
    morning: {
        label: 'Morning (Before 12 PM)',
        icon: <Sunrise size={14} className="text-amber-500" />,
    },
    afternoon: {
        label: 'Afternoon (12 PM – 5 PM)',
        icon: <Sun size={14} className="text-orange-500" />,
    },
    evening: {
        label: 'Evening (After 5 PM)',
        icon: <Sunset size={14} className="text-indigo-500" />,
    },
};

function getSlotPeriod(isoLocal: string): Period {
    const hour = new Date(isoLocal).getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
}

function formatDayTabTitle(dayKey: string): { title: string; subtitle: string } {
    const d = new Date(dayKey + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const title = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short' });
    const subtitle = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return { title, subtitle };
}

export default function FulfillmentSlotPicker({
    retailerId,
    deliveryMode,
    selectedSlotStart,
    onSelect,
    days = 7,
    refreshKey = 0,
    onLoaded,
}: FulfillmentSlotPickerProps) {
    const [slots, setSlots] = useState<FulfillmentSlot[]>([]);
    const [slotCapacity, setSlotCapacity] = useState<number | null>(null);
    const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

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
                const fetchedSlots = data.slots ?? [];
                setSlots(fetchedSlots);
                const openCount = fetchedSlots.filter((slot: FulfillmentSlot) => slot.is_available).length;
                onLoaded?.({ openSlots: openCount, failed: false });
                setSlotCapacity(data.slot_capacity ?? null);
                setTimezone(data.timezone ?? 'Asia/Kolkata');
            } catch (e) {
                if (cancelled) return;
                console.error(e);
                setError('Could not load available time slots. Please try again.');
                setSlots([]);
                onLoaded?.({ openSlots: 0, failed: true });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        if (retailerId) load();
        return () => { cancelled = true; };
    }, [retailerId, deliveryMode, days, refreshKey]);

    const availableSlots = useMemo(() => slots.filter((s) => s.is_available), [slots]);
    const groupedDays = useMemo(() => groupSlotsByDay(availableSlots), [availableSlots]);
    const dayKeys = useMemo(() => Array.from(groupedDays.keys()), [groupedDays]);

    // Set initial active day tab (or sync with existing selected slot)
    useEffect(() => {
        if (dayKeys.length === 0) {
            setSelectedDayKey(null);
            return;
        }

        if (selectedSlotStart) {
            const foundDay = dayKeys.find((key) =>
                groupedDays.get(key)?.some((s) => s.slot_start === selectedSlotStart)
            );
            if (foundDay) {
                setSelectedDayKey(foundDay);
                return;
            }
        }

        setSelectedDayKey((prev) => (prev && dayKeys.includes(prev) ? prev : dayKeys[0]));
    }, [dayKeys, selectedSlotStart, groupedDays]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center bg-gray-50/50 rounded-xl border border-gray-100">
                <Loader2 size={16} className="animate-spin text-primary" />
                Loading available time slots…
            </div>
        );
    }

    if (error) {
        return <p className="text-sm text-red-600 py-2">{error}</p>;
    }

    if (availableSlots.length === 0) {
        return (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <p className="text-sm font-medium text-gray-700">No open time slots available</p>
                <p className="text-xs text-gray-500 mt-1">
                    No {deliveryMode} slots open for the next {days} days. Standard store processing will apply.
                </p>
            </div>
        );
    }

    const currentDaySlots = selectedDayKey ? groupedDays.get(selectedDayKey) ?? [] : [];

    // Group active day's slots by period
    const periodSlots: Record<Period, FulfillmentSlot[]> = {
        morning: [],
        afternoon: [],
        evening: [],
    };
    for (const slot of currentDaySlots) {
        const period = getSlotPeriod(slot.slot_start_local);
        periodSlots[period].push(slot);
    }

    return (
        <div className="flex flex-col gap-3.5">
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1 font-medium text-gray-600">
                    <Calendar size={13} className="text-blue-600" />
                    Select date &amp; slot
                </span>
                {slotCapacity != null && (
                    <span className="text-[11px] text-gray-400">
                        30-min delivery windows
                    </span>
                )}
            </div>

            {/* Horizontal Day Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {dayKeys.map((dayKey) => {
                    const isTabActive = selectedDayKey === dayKey;
                    const { title, subtitle } = formatDayTabTitle(dayKey);
                    const hasSelectedSlotInDay = groupedDays.get(dayKey)?.some((s) => s.slot_start === selectedSlotStart);

                    return (
                        <button
                            key={dayKey}
                            type="button"
                            onClick={() => setSelectedDayKey(dayKey)}
                            className={`flex flex-col items-center justify-center min-w-[78px] px-3 py-2 rounded-xl border text-center transition-all shrink-0 relative cursor-pointer ${
                                isTabActive
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                    : 'bg-gray-50/70 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100/70'
                            }`}
                        >
                            {hasSelectedSlotInDay && (
                                <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ${
                                    isTabActive ? 'bg-amber-300 ring-blue-600' : 'bg-blue-600 ring-white'
                                }`} />
                            )}
                            <span className="text-xs font-bold leading-tight">{title}</span>
                            <span className={`text-[10px] mt-0.5 leading-tight ${isTabActive ? 'text-blue-100' : 'text-gray-400'}`}>
                                {subtitle}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Slots for Selected Day, grouped by period */}
            <div className="flex flex-col gap-3 pt-1">
                {(['morning', 'afternoon', 'evening'] as Period[]).map((period) => {
                    const group = periodSlots[period];
                    if (!group || group.length === 0) return null;
                    const config = PERIOD_CONFIG[period];

                    return (
                        <div key={period} className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                {config.icon}
                                {config.label}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {group.map((slot) => {
                                    const isSelected = selectedSlotStart === slot.slot_start;
                                    const startTime = formatSlotTimeOnly(slot.slot_start_local);
                                    const endTime = formatSlotTimeOnly(slot.slot_end_local);

                                    return (
                                        <button
                                            key={slot.slot_start}
                                            type="button"
                                            onClick={() => onSelect(isSelected ? null : slot)}
                                            className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-50/90 text-blue-900 shadow-xs ring-1 ring-blue-500'
                                                    : 'border-gray-200 bg-white text-gray-800 hover:border-blue-200 hover:bg-gray-50/80'
                                            }`}
                                        >
                                            <div className="min-w-0 flex-1 pr-1.5">
                                                <div className="text-xs font-semibold leading-tight">
                                                    {startTime} – {endTime}
                                                </div>
                                                {slot.remaining != null && slot.remaining > 0 && slot.remaining <= 3 && (
                                                    <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                                                        {slot.remaining} left
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                                    isSelected
                                                        ? 'border-blue-600 bg-blue-600 text-white'
                                                        : 'border-gray-300 bg-white'
                                                }`}
                                            >
                                                {isSelected && <Check size={10} strokeWidth={3} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
