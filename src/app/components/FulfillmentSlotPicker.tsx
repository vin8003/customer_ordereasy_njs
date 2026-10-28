'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Clock,
    Loader2,
    Check,
    Sun,
    Sunset,
    Sunrise,
    Calendar,
    ChevronRight,
    X,
    RotateCw,
} from 'lucide-react';
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
    selectedSlot?: FulfillmentSlot | null;
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

function formatSlotSummary(slot: FulfillmentSlot): string {
    const start = new Date(slot.slot_start_local);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isToday = start.toDateString() === today.toDateString();
    const isTomorrow = start.toDateString() === tomorrow.toDateString();

    const dayPrefix = isToday
        ? 'Today'
        : isTomorrow
        ? 'Tomorrow'
        : start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    const startTime = formatSlotTimeOnly(slot.slot_start_local);
    const endTime = formatSlotTimeOnly(slot.slot_end_local);

    return `${dayPrefix}, ${startTime} – ${endTime}`;
}

export default function FulfillmentSlotPicker({
    retailerId,
    deliveryMode,
    selectedSlotStart,
    selectedSlot,
    onSelect,
    days = 7,
    refreshKey = 0,
    onLoaded,
}: FulfillmentSlotPickerProps) {
    const [slots, setSlots] = useState<FulfillmentSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
    const [pendingSlot, setPendingSlot] = useState<FulfillmentSlot | null>(null);

    const loadSlots = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getFulfillmentSlots(
                retailerId,
                { delivery_mode: deliveryMode, days },
                refreshKey > 0
            );
            const fetchedSlots = data.slots ?? [];
            setSlots(fetchedSlots);
            const openCount = fetchedSlots.filter((slot: FulfillmentSlot) => slot.is_available).length;
            onLoaded?.({ openSlots: openCount, failed: false });
        } catch (e) {
            console.error(e);
            setError('Could not load available time slots.');
            setSlots([]);
            onLoaded?.({ openSlots: 0, failed: true });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (retailerId) {
            loadSlots();
        }
    }, [retailerId, deliveryMode, days, refreshKey]);

    const availableSlots = useMemo(() => slots.filter((s) => s.is_available), [slots]);
    const groupedDays = useMemo(() => groupSlotsByDay(availableSlots), [availableSlots]);
    const dayKeys = useMemo(() => Array.from(groupedDays.keys()), [groupedDays]);

    // Resolved active slot
    const activeSlot = useMemo(() => {
        if (selectedSlot) return selectedSlot;
        if (selectedSlotStart) {
            return slots.find((s) => s.slot_start === selectedSlotStart) ?? null;
        }
        return null;
    }, [selectedSlot, selectedSlotStart, slots]);

    // When drawer opens, initialize pending slot & active day
    const handleOpenDrawer = () => {
        setPendingSlot(activeSlot);
        if (activeSlot) {
            const foundDay = dayKeys.find((key) =>
                groupedDays.get(key)?.some((s) => s.slot_start === activeSlot.slot_start)
            );
            if (foundDay) {
                setSelectedDayKey(foundDay);
            } else if (dayKeys.length > 0) {
                setSelectedDayKey(dayKeys[0]);
            }
        } else if (dayKeys.length > 0) {
            setSelectedDayKey(dayKeys[0]);
        }
        setIsDrawerOpen(true);
    };

    const handleConfirm = () => {
        onSelect(pendingSlot);
        setIsDrawerOpen(false);
    };

    const handleClear = () => {
        setPendingSlot(null);
        onSelect(null);
        setIsDrawerOpen(false);
    };

    // Close drawer on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isDrawerOpen) {
                setIsDrawerOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrawerOpen]);

    // Active day slots
    const currentDaySlots = selectedDayKey ? groupedDays.get(selectedDayKey) ?? [] : [];
    const periodSlots: Record<Period, FulfillmentSlot[]> = {
        morning: [],
        afternoon: [],
        evening: [],
    };
    for (const slot of currentDaySlots) {
        const period = getSlotPeriod(slot.slot_start_local);
        periodSlots[period].push(slot);
    }

    // 1. Loading State (Compact Skeleton)
    if (isLoading) {
        return (
            <div className="flex items-center gap-3 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                    <Loader2 size={18} className="animate-spin text-gray-400" />
                </div>
                <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-48 bg-gray-100 rounded" />
                </div>
            </div>
        );
    }

    // 2. Error State (Compact with Retry)
    if (error) {
        return (
            <div className="flex items-center justify-between gap-3 p-3.5 bg-red-50/60 rounded-2xl border border-red-200 text-sm">
                <div className="flex items-center gap-2.5 text-red-700">
                    <Clock size={18} className="shrink-0" />
                    <span>{error}</span>
                </div>
                <button
                    type="button"
                    onClick={loadSlots}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100/80 rounded-lg transition-colors cursor-pointer"
                >
                    <RotateCw size={12} /> Retry
                </button>
            </div>
        );
    }

    // 3. No Slots Available State (Compact informational card)
    if (availableSlots.length === 0) {
        return (
            <div className="flex items-center justify-between gap-3 p-3.5 bg-gray-50/70 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                        <Clock size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {deliveryMode === 'pickup' ? 'Pickup Slot' : 'Delivery Slot'}
                        </div>
                        <div className="text-sm font-semibold text-gray-700">
                            Standard store processing
                        </div>
                        <div className="text-[11px] text-gray-400">
                            No slot reservation required for this order
                        </div>
                    </div>
                </div>
                <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                    Standard
                </span>
            </div>
        );
    }

    // 4. Standard Compact Trigger Card + Bottom Sheet Drawer
    return (
        <>
            {/* Compact Trigger Card on Checkout Screen */}
            <div
                data-testid="slot-picker-open"
                role="button"
                tabIndex={0}
                onClick={handleOpenDrawer}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenDrawer();
                    }
                }}
                className={`group flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeSlot
                        ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50/80 hover:border-blue-300 shadow-2xs'
                        : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50/70 shadow-2xs'
                }`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            activeSlot
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                        }`}
                    >
                        <Clock size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {deliveryMode === 'pickup' ? 'Pickup Slot' : 'Delivery Slot'}
                            </span>
                            {activeSlot && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.2 text-[10px] font-bold">
                                    <Check size={10} strokeWidth={3} /> Selected
                                </span>
                            )}
                        </div>
                        <div data-testid="slot-summary" className="text-sm font-bold text-gray-900 truncate mt-0.5">
                            {activeSlot ? formatSlotSummary(activeSlot) : 'Choose preferred time slot'}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                            {activeSlot ? 'Tap to change scheduled window' : 'Select a convenient 30-min window'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-white border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 shadow-2xs">
                    <span>{activeSlot ? 'Change' : 'Choose'}</span>
                    <ChevronRight size={14} />
                </div>
            </div>

            {/* Bottom Sheet Drawer Modal */}
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgb(11_19_36/0.5)] p-0 backdrop-blur-xs sm:items-center sm:p-4"
                    onClick={() => setIsDrawerOpen(false)}
                >
                    <div
                        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-200 sm:rounded-3xl sm:pb-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mobile Drag Bar */}
                        <div className="mx-auto mt-2.5 mb-1 h-1.5 w-12 rounded-full bg-gray-200 sm:hidden" />

                        {/* Sheet Header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold tracking-tight text-gray-900">
                                        {deliveryMode === 'pickup' ? 'Select Pickup Slot' : 'Select Delivery Slot'}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Choose date and a convenient 30-min window
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDrawerOpen(false)}
                                aria-label="Close"
                                className="flex size-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Sheet Scrollable Body */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 max-h-[60vh]">
                            {/* Horizontal Day Tabs */}
                            <div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Select Date
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {dayKeys.map((dayKey) => {
                                        const isTabActive = selectedDayKey === dayKey;
                                        const { title, subtitle } = formatDayTabTitle(dayKey);
                                        const hasPendingSlotInDay = groupedDays
                                            .get(dayKey)
                                            ?.some((s) => s.slot_start === pendingSlot?.slot_start);

                                        return (
                                            <button
                                                key={dayKey}
                                                data-testid={`slot-day-${dayKey}`}
                                                type="button"
                                                onClick={() => setSelectedDayKey(dayKey)}
                                                className={`flex flex-col items-center justify-center min-w-[80px] px-3.5 py-2.5 rounded-2xl border text-center transition-all shrink-0 relative cursor-pointer ${
                                                    isTabActive
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100/70'
                                                }`}
                                            >
                                                {hasPendingSlotInDay && (
                                                    <span
                                                        className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ${
                                                            isTabActive ? 'bg-amber-300 ring-blue-600' : 'bg-blue-600 ring-white'
                                                        }`}
                                                    />
                                                )}
                                                <span className="text-xs font-extrabold leading-tight">{title}</span>
                                                <span
                                                    className={`text-[10px] mt-0.5 leading-tight ${
                                                        isTabActive ? 'text-blue-100' : 'text-gray-400'
                                                    }`}
                                                >
                                                    {subtitle}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Slot Grid by Period */}
                            <div className="space-y-3.5 pt-1">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Available Time Windows
                                </div>

                                {currentDaySlots.length === 0 ? (
                                    <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                                        No slots available for this date. Please pick another day.
                                    </div>
                                ) : (
                                    (['morning', 'afternoon', 'evening'] as Period[]).map((period) => {
                                        const group = periodSlots[period];
                                        if (!group || group.length === 0) return null;
                                        const config = PERIOD_CONFIG[period];

                                        return (
                                            <div key={period} className="space-y-1.5">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                                    {config.icon}
                                                    {config.label}
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {group.map((slot) => {
                                                        const isSelected = pendingSlot?.slot_start === slot.slot_start;
                                                        const startTime = formatSlotTimeOnly(slot.slot_start_local);
                                                        const endTime = formatSlotTimeOnly(slot.slot_end_local);

                                                        return (
                                                            <button
                                                                key={slot.slot_start}
                                                                data-testid="slot-option"
                                                                data-slot-start={slot.slot_start_local}
                                                                type="button"
                                                                onClick={() => setPendingSlot(isSelected ? null : slot)}
                                                                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                                    isSelected
                                                                        ? 'border-blue-600 bg-blue-50/90 text-blue-900 ring-1 ring-blue-500 shadow-xs'
                                                                        : 'border-gray-200 bg-white text-gray-800 hover:border-blue-200 hover:bg-gray-50/80'
                                                                }`}
                                                            >
                                                                <div className="min-w-0 flex-1 pr-1.5">
                                                                    <div className="text-xs font-bold leading-tight">
                                                                        {startTime} – {endTime}
                                                                    </div>
                                                                    {slot.remaining != null && slot.remaining > 0 && slot.remaining <= 3 && (
                                                                        <div className="text-[10px] text-amber-600 font-bold mt-0.5">
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
                                    })
                                )}
                            </div>
                        </div>

                        {/* Sheet Footer */}
                        <div className="border-t border-gray-100 bg-gray-50/60 p-4 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 font-medium">Selected Slot:</span>
                                <span className="font-bold text-gray-900">
                                    {pendingSlot ? formatSlotSummary(pendingSlot) : 'None (No preference)'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                                {activeSlot && (
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                )}
                                <button
                                    type="button"
                                    data-testid="slot-confirm"
                                    onClick={handleConfirm}
                                    disabled={!pendingSlot}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold text-sm shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Check size={16} strokeWidth={2.5} />
                                    Confirm Slot
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
