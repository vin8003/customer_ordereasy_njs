'use client';

import React from 'react';
import { X } from 'lucide-react';
import {
    buildOrderStatusTimeline,
    OrderStatusTimelineInput,
} from '@/lib/orderStatusTimeline';

function formatStepAt(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

/** Horizontal status stepper for order detail (OE-280). */
export default function OrderStatusTimeline(order: OrderStatusTimelineInput) {
    const steps = buildOrderStatusTimeline(order);

    return (
        <section
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm max-w-2xl mx-auto w-full"
            aria-label="Order status timeline"
        >
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Status timeline
            </h3>
            <ol className="flex items-start w-full">
                {steps.map((step, index) => {
                    const prevReached = index === 0 || steps[index - 1].reached;
                    const nextReached = index < steps.length - 1 && step.reached && steps[index + 1].reached;
                    const at = formatStepAt(step.at);

                    return (
                        <li key={step.key} className="flex-1 min-w-0 flex flex-col items-center">
                            <div className="flex items-center w-full">
                                <div
                                    className={`h-0.5 flex-1 ${
                                        index === 0
                                            ? 'bg-transparent'
                                            : step.failed
                                              ? 'bg-rose-300'
                                              : prevReached && step.reached
                                                ? 'bg-emerald-500'
                                                : 'bg-gray-200'
                                    }`}
                                    aria-hidden
                                />
                                <span
                                    className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                        step.failed
                                            ? 'bg-rose-600 text-white'
                                            : step.current
                                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                              : step.reached
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-200 text-gray-400'
                                    }`}
                                    aria-current={step.current ? 'step' : undefined}
                                >
                                    {step.failed ? <X size={12} strokeWidth={3} aria-hidden /> : index + 1}
                                </span>
                                <div
                                    className={`h-0.5 flex-1 ${
                                        index === steps.length - 1
                                            ? 'bg-transparent'
                                            : nextReached
                                              ? 'bg-emerald-500'
                                              : 'bg-gray-200'
                                    }`}
                                    aria-hidden
                                />
                            </div>
                            <span
                                className={`mt-2 text-[11px] leading-tight text-center px-1 ${
                                    step.failed
                                        ? 'font-bold text-rose-700'
                                        : step.current
                                          ? 'font-bold text-indigo-800'
                                          : step.reached
                                            ? 'font-medium text-gray-800'
                                            : 'text-gray-400'
                                }`}
                            >
                                {step.label}
                            </span>
                            {at && (
                                <span className="mt-0.5 text-[10px] leading-tight text-center text-gray-500 px-1">
                                    {at}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
