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
    benefit_type?: string;
}

export interface AvailableCoupon {
    id: number;
    name: string;
    code: string;
    offer_type: string;
    benefit_type: string;
    value: number;
    minimum_order_amount?: number;
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
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                        <Ticket size={18} />
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">Coupons & Offers</span>
                </div>
                {!appliedCoupon && (
                    <button
                        type="button"
                        onClick={handleOpenAvailable}
                        className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5"
                    >
                        View All
                        <ChevronRight size={14} />
                    </button>
                )}
            </div>

            {appliedCoupon ? (
                /* Applied Coupon State */
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-emerald-900 tracking-wide text-sm">
                                    {appliedCoupon.code}
                                </span>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                                    Applied
                                </span>
                            </div>
                            <p className="text-xs text-emerald-700 font-medium mt-0.5">
                                {appliedCoupon.benefit_type === 'credit_points'
                                    ? `+${appliedCoupon.points || 0} Shop Cashback Points`
                                    : `₹${Number(appliedCoupon.discount || 0).toFixed(2)} savings with this coupon`}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isRemoving || disabled}
                        className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-red-200"
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
                                placeholder="ENTER COUPON CODE"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleApply();
                                    }
                                }}
                                disabled={isApplying || disabled}
                                className="w-full text-xs font-mono font-semibold uppercase px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400 placeholder:font-sans placeholder:font-normal placeholder:normal-case"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleApply()}
                            disabled={!couponInput.trim() || isApplying || disabled}
                            className="px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[70px]"
                        >
                            {isApplying ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                        </button>
                    </div>

                    {couponError && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                            {couponError}
                        </p>
                    )}
                </div>
            )}

            {/* Available Coupons Drawer/Modal */}
            {isSheetOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
                    onClick={() => setIsSheetOpen(false)}
                >
                    <div
                        className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                                    <Sparkles size={18} />
                                </div>
                                <h3 className="font-bold text-gray-900 text-base">Available Coupons</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSheetOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="p-4 overflow-y-auto space-y-3 flex-1">
                            {isLoadingCoupons ? (
                                <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
                                    <Loader2 size={24} className="animate-spin text-primary" />
                                    <span className="text-xs">Finding available offers...</span>
                                </div>
                            ) : availableCoupons.length === 0 ? (
                                <div className="py-10 text-center px-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-3">
                                        <Tag size={20} />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800">No Public Coupons Right Now</p>
                                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                                        If the shop shared a secret coupon code with you directly, enter it in the coupon box!
                                    </p>
                                </div>
                            ) : (
                                availableCoupons.map((coupon) => (
                                    <div
                                        key={coupon.id}
                                        className="border border-dashed border-gray-300 rounded-xl p-3.5 bg-gradient-to-r from-purple-50/50 via-white to-pink-50/30 hover:border-purple-300 transition-colors flex justify-between items-center gap-3"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-purple-900 bg-purple-100/80 px-2 py-0.5 rounded text-xs tracking-wider border border-purple-200">
                                                    {coupon.code}
                                                </span>
                                                {coupon.benefit_type === 'credit_points' && (
                                                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                                                        Cashback
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-sm font-semibold text-gray-900">{coupon.name}</h4>
                                            <p className="text-xs text-gray-500">
                                                {coupon.benefit_type === 'credit_points' ? (
                                                    <span>Earn {coupon.value} points on purchase</span>
                                                ) : coupon.offer_type === 'percentage' ? (
                                                    <span>Get {coupon.value}% off{coupon.maximum_discount ? ` up to ₹${coupon.maximum_discount}` : ''}</span>
                                                ) : (
                                                    <span>Get ₹{coupon.value} flat discount</span>
                                                )}
                                                {coupon.minimum_order_amount && coupon.minimum_order_amount > 0 ? (
                                                    <span> · Min. order ₹{coupon.minimum_order_amount}</span>
                                                ) : null}
                                            </p>
                                            {coupon.end_date && (
                                                <p className="text-[11px] text-gray-400">
                                                    Valid till {new Date(coupon.end_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleApply(coupon.code)}
                                            disabled={isApplying || disabled}
                                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-sm"
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
