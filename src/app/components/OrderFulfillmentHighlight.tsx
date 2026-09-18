'use client';

import React from 'react';
import { Package, Truck, Phone, Clock } from 'lucide-react';
import {
    OrderFulfillmentHighlightFields,
    formatDeliveryEta,
    formatDeliveryStatusLabel,
    formatPickupReadyMessage,
    hasDeliveryCourierHighlight,
    hasPickupCodeHighlight,
} from '@/lib/orderFulfillmentDisplay';

type Variant = 'prominent' | 'compact';

interface Props extends OrderFulfillmentHighlightFields {
    variant?: Variant;
    className?: string;
}

/** Pickup code + ready messaging, or delivery courier strip (RCP #82 detail fields). */
export default function OrderFulfillmentHighlight({
    variant = 'prominent',
    className = '',
    ...order
}: Props) {
    const showPickup = hasPickupCodeHighlight(order);
    const showCourier = hasDeliveryCourierHighlight(order);

    if (!showPickup && !showCourier) return null;

    if (showPickup) {
        const readyMessage = formatPickupReadyMessage(order.status, order.pickup_ready_at);
        if (variant === 'compact') {
            return (
                <div
                    className={`flex items-center justify-between gap-2 mt-2 p-2.5 bg-emerald-50 border-2 border-emerald-200 rounded-lg ${className}`}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <Package size={16} className="text-emerald-700 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            Pickup code
                        </span>
                    </div>
                    <span className="font-black text-lg tracking-[0.2em] text-emerald-900 tabular-nums">
                        {order.pickup_code}
                    </span>
                </div>
            );
        }

        return (
            <div
                className={`rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 p-4 shadow-sm ${className}`}
            >
                <div className="flex items-center gap-2 mb-2">
                    <Package size={20} className="text-emerald-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Pickup code — show at counter
                    </span>
                </div>
                <div className="text-center py-2">
                    <span className="font-black text-4xl tracking-[0.35em] text-emerald-900 tabular-nums">
                        {order.pickup_code}
                    </span>
                </div>
                {readyMessage && (
                    <p className="text-sm text-emerald-800 text-center mt-1 leading-snug">{readyMessage}</p>
                )}
            </div>
        );
    }

    const info = order.delivery_info!;
    const statusLabel = formatDeliveryStatusLabel(info.delivery_status);
    const eta = formatDeliveryEta(info.estimated_delivery_time);

    if (variant === 'compact') {
        return (
            <div
                className={`mt-2 p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-xs ${className}`}
            >
                <div className="flex items-center gap-1.5 font-bold text-sky-800 mb-1">
                    <Truck size={14} />
                    {statusLabel ?? 'Courier update'}
                </div>
                {info.delivery_person_name && (
                    <p className="font-medium text-gray-800">{info.delivery_person_name}</p>
                )}
                {eta && (
                    <p className="text-sky-700 flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> ETA {eta}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={`rounded-xl border border-sky-200 bg-sky-50 p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <Truck size={20} className="text-sky-700" />
                <span className="text-sm font-bold text-sky-900">
                    {statusLabel ?? 'Delivery update'}
                </span>
            </div>
            {info.delivery_person_name && (
                <p className="font-semibold text-gray-900">{info.delivery_person_name}</p>
            )}
            {info.delivery_person_phone && (
                <a
                    href={`tel:${info.delivery_person_phone}`}
                    className="inline-flex items-center gap-1.5 text-sky-700 font-medium mt-1 hover:underline"
                >
                    <Phone size={14} />
                    {info.delivery_person_phone}
                </a>
            )}
            {eta && (
                <p className="flex items-center gap-1.5 text-sm text-sky-800 mt-2 font-medium">
                    <Clock size={14} />
                    Estimated arrival: {eta}
                </p>
            )}
        </div>
    );
}
