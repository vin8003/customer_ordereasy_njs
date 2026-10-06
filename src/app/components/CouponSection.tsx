'use client';

import React, { useState } from 'react';
import { Tag, Ticket, Check, X, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import toast from '@/lib/toast';

export interface AppliedCoupon {
    code: string;
    name?: string;
    discount?: number;
    points?: number;
    savings?: number;
    benefit_type?: string;
}

export interface AvailableCoupon {
    id: number;
    name: string;
    code: string;
    offer_type: string;
    benefit_type: string;
    value: number;
    value_type?: string;
    min_order_value?: number;
    minimum_order_amount?: number;
    max_discount_amount?: number;
    maximum_discount?: number;
    end_date?: string | null;
}

interface CouponSectionProps {
    retailerId: string | number;
    appliedCoupon?: AppliedCoupon | null;
    couponError?: string | null;
    onCouponChanged: () => void;
    disabled?: boolean;
}

export default function CouponSection({
    retailerId,
    appliedCoupon,
    couponError,
    onCouponChanged,
    disabled = false,
}: CouponSectionProps) {
    const [couponInput, setCouponInput] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
    const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

    const handleApply = async (codeToApply?: string) => {
        const code = (codeToApply || couponInput).trim().toUpperCase();
        if (!code) {
            toast.error('Please enter a coupon code');
            return;
        }

        if (!apiService.isAuthenticated()) {
            toast.error('Please log in to apply coupons');
            return;
        }

        setIsApplying(true);
        try {
            const res = await apiService.applyCoupon(retailerId, code);
            toast.success(res.message || `Coupon ${code} applied successfully!`);
            setCouponInput('');
            setIsSheetOpen(false);
            onCouponChanged();
        } catch (error: any) {
            const errorMsg = error?.response?.data?.error || 'Could not apply coupon';
            toast.error(errorMsg);
        } finally {
            setIsApplying(false);
        }
    };

    const handleRemove = async () => {
        try {
            setIsRemoving(true);
            await apiService.removeCoupon(retailerId);
            toast.success('Coupon removed');
            onCouponChanged();
        } catch (error: any) {
            toast.error('Failed to remove coupon');
        } finally {
            setIsRemoving(false);
        }
    };

    const handleOpenAvailable = async () => {
        setIsSheetOpen(true);
        setIsLoadingCoupons(true);
        try {
            const coupons = await apiService.getAvailableCoupons(retailerId);
            setAvailableCoupons(coupons || []);
        } catch (error) {
            console.error('Failed to load available coupons', error);
            setAvailableCoupons([]);
        } finally {
            setIsLoadingCoupons(false);
        }
    };

    return (
        <div className="rounded-[var(--r-lg)] border border-[var(--line)] bg-white p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-[10px] bg-violet-50 text-violet-600">
                        <Ticket size={17} />
                    </div>
                    <span className="text-[15px] font-bold tracking-tight text-[var(--ink)]">Coupons & offers</span>
                </div>
                {!appliedCoupon && (
                    <button
                        type="button"
                        onClick={handleOpenAvailable}
                        className="flex items-center gap-0.5 rounded-full px-2 py-1 text-[13px] font-bold text-[var(--brand-600)] hover:bg-[var(--brand-50)]"
                    >
                        View all
                        <ChevronRight size={14} />
                    </button>
                )}
            </div>

            {appliedCoupon ? (
                /* Applied Coupon State */
                <div className="flex items-center justify-between gap-3 rounded-[var(--r-md)] border border-dashed border-[var(--fresh-500)] bg-[var(--fresh-50)] p-3">
                    <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--fresh-600)] text-white">
                            <Check size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold tracking-wide text-[var(--fresh-700)]">
                                    {appliedCoupon.code}
                                </span>
                                <span className="rounded-full bg-[var(--fresh-100)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--fresh-700)]">
                                    Applied
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-[var(--fresh-700)]">
                                {appliedCoupon.benefit_type === 'credit_points'
                                    ? `+${(appliedCoupon.points ?? appliedCoupon.savings ?? 0)} Shop Cashback Points`
                                    : `₹${Number(appliedCoupon.discount ?? appliedCoupon.savings ?? 0).toFixed(2)} savings with this coupon`}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isRemoving || disabled}
                        className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--rose-600)] transition-colors hover:bg-[var(--rose-50)]"
                    >
                        {isRemoving ? <Loader2 size={14} className="animate-spin" /> : 'Remove'}
                    </button>
                </div>
            ) : (
                /* Apply Coupon Input */
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Enter coupon code"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleApply();
                                    }
                                }}
                                disabled={isApplying || disabled}
                                className="h-11 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3.5 font-mono text-sm font-semibold uppercase tracking-wider text-[var(--ink)] placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--ink-4)] focus:border-[var(--brand-500)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-100)]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleApply()}
                            disabled={!couponInput.trim() || isApplying || disabled}
                            className="flex h-11 min-w-[84px] items-center justify-center rounded-xl bg-[var(--ink)] px-4 text-sm font-bold text-white transition-all hover:bg-[var(--ink-2)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isApplying ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                        </button>
                    </div>

                    {couponError && (
                        <p className="mt-1 text-xs font-semibold text-[var(--rose-600)]">
                            {couponError}
                        </p>
                    )}
                </div>
            )}

            {/* Available Coupons Drawer/Modal */}
            {isSheetOpen && (
                <div 
                    className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgb(11_19_36/0.45)] p-0 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={() => setIsSheetOpen(false)}
                >
                    <div
                        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-[var(--r-xl)] bg-white pb-[env(safe-area-inset-bottom)] shadow-[var(--sh-lg)] animate-in fade-in slide-in-from-bottom-8 duration-300 sm:rounded-[var(--r-xl)] sm:pb-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-5 py-4">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-[10px] bg-violet-50 text-violet-600">
                                    <Sparkles size={17} />
                                </div>
                                <h3 className="text-lg font-extrabold tracking-tight text-[var(--ink)]">Available coupons</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSheetOpen(false)}
                                aria-label="Close" className="flex size-9 items-center justify-center rounded-[10px] bg-[var(--surface-2)] text-[var(--ink-2)] hover:bg-[var(--surface-3)]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 pb-6">
                            {isLoadingCoupons ? (
                                <div className="flex flex-col items-center gap-2 py-12 text-center text-[var(--ink-4)]">
                                    <Loader2 size={24} className="animate-spin text-primary" />
                                    <span className="text-xs">Finding available offers...</span>
                                </div>
                            ) : availableCoupons.length === 0 ? (
                                <div className="py-10 text-center px-4">
                                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--ink-4)]">
                                        <Tag size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-[var(--ink)]">No Public Coupons Right Now</p>
                                    <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[var(--ink-3)]">
                                        If the shop shared a secret coupon code with you directly, enter it in the coupon box!
                                    </p>
                                </div>
                            ) : (
                                availableCoupons.map((coupon) => (
                                    <div
                                        key={coupon.id}
                                        className="relative flex items-center justify-between gap-3 overflow-hidden rounded-[var(--r-md)] border border-[var(--line)] bg-white p-3.5 pl-5 shadow-[var(--sh-xs)] transition-colors before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-violet-500 hover:border-violet-300"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-md border border-dashed border-violet-300 bg-violet-50 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-violet-800">
                                                    {coupon.code}
                                                </span>
                                                {coupon.benefit_type === 'credit_points' && (
                                                    <span className="rounded-full bg-[var(--amber-100)] px-2 py-0.5 text-[10px] font-bold text-[var(--amber-700)]">
                                                        Cashback
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-sm font-bold text-[var(--ink)]">{coupon.name}</h4>
                                            <p className="text-xs leading-relaxed text-[var(--ink-3)]">
                                                {coupon.benefit_type === 'credit_points' ? (
                                                    (coupon.offer_type === 'percentage' || coupon.value_type === 'percent') ? (
                                                        <span>
                                                            Get {coupon.value}% cashback
                                                            {(coupon.max_discount_amount ?? coupon.maximum_discount) ? ` up to ${(coupon.max_discount_amount ?? coupon.maximum_discount)} pts` : ''}
                                                        </span>
                                                    ) : (
                                                        <span>Get {coupon.value} flat cashback pts</span>
                                                    )
                                                ) : (
                                                    (coupon.offer_type === 'percentage' || coupon.value_type === 'percent') ? (
                                                        <span>
                                                            Get {coupon.value}% off
                                                            {(coupon.max_discount_amount ?? coupon.maximum_discount) ? ` up to ₹${(coupon.max_discount_amount ?? coupon.maximum_discount)}` : ''}
                                                        </span>
                                                    ) : (
                                                        <span>Get ₹{coupon.value} flat discount</span>
                                                    )
                                                )}
                                                {((coupon.min_order_value ?? coupon.minimum_order_amount) || 0) > 0 ? (
                                                    <span> · Min. order ₹{coupon.min_order_value ?? coupon.minimum_order_amount}</span>
                                                ) : null}
                                            </p>
                                            {coupon.end_date && (
                                                <p className="text-[11px] text-[var(--ink-4)]">
                                                    Valid till {new Date(coupon.end_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleApply(coupon.code)}
                                            disabled={isApplying || disabled}
                                            className="shrink-0 rounded-[10px] border border-[var(--brand-600)] px-3.5 py-2 text-xs font-bold text-[var(--brand-700)] transition-colors hover:bg-[var(--brand-600)] hover:text-white disabled:opacity-50"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
