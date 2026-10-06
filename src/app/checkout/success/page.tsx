'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';

export default function CheckoutSuccessPage() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--canvas)] px-6 py-12 text-center">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_80%_at_50%_0%,rgb(34_168_90/0.18)_0%,transparent_70%)]"
            />
            <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
                <div className="relative mx-auto mb-7 flex size-24 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-[var(--fresh-500)] opacity-20 [animation-iteration-count:2]" />
                    <span className="absolute inset-2 rounded-full bg-[var(--fresh-100)]" />
                    <span className="relative flex size-16 items-center justify-center rounded-full bg-[var(--fresh-600)] text-white shadow-[var(--sh-fresh)]">
                        <Check size={34} strokeWidth={3} />
                    </span>
                </div>

                <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em] text-[var(--ink)]">
                    Order placed!
                </h1>
                <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-[var(--ink-3)]">
                    Thank you for your order. We will deliver it to you shortly.
                </p>

                <div className="mt-8 flex items-center gap-3 rounded-[var(--r-lg)] border border-[var(--line)] bg-white p-4 text-left shadow-[var(--sh-xs)]">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-600)]">
                        <Package size={20} />
                    </span>
                    <p className="text-[13px] leading-snug text-[var(--ink-3)]">
                        Track status, chat with the store and pay from <strong className="text-[var(--ink)]">My Orders</strong>.
                    </p>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    <Button asChild size="lg" fullWidth>
                        <Link href="/orders">
                            View My Orders <ArrowRight size={18} />
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" size="lg" fullWidth>
                        <Link href="/retailers">Continue Shopping</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
