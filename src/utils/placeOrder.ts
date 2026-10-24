export interface PlaceOrderInput {
    retailerId: string;
    deliveryMode: 'delivery' | 'pickup';
    selectedAddressId: number | null;
    paymentMethod: string;
    specialInstructions: string;
    useRewardPoints: boolean;
    couponCode?: string | null;
    fulfillmentSlotStart?: string | null;
}

/** Matches the historical `orders/place/` request body used before Phases 1–3. */
export interface PlaceOrderPayload {
    retailer_id: string;
    delivery_mode: 'delivery' | 'pickup';
    payment_mode: string;
    special_instructions: string;
    use_reward_points: boolean;
    address_id: number | null;
    coupon_code?: string | null;
    fulfillment_slot_start?: string | null;
}

export function resolvePlaceOrderPaymentMode(paymentMethod: string): string {
    return paymentMethod === 'cod' ? 'cash' : paymentMethod;
}

export function buildPlaceOrderPayload(input: PlaceOrderInput): PlaceOrderPayload {
    const retailerId = input.retailerId.trim();
    if (!retailerId || !/^\d+$/.test(retailerId)) {
        throw new Error('Invalid retailer session. Please return to the shop and try again.');
    }

    if (input.deliveryMode === 'delivery' && !input.selectedAddressId) {
        throw new Error('Please select a delivery address.');
    }

    const payload: PlaceOrderPayload = {
        retailer_id: retailerId,
        address_id: input.deliveryMode === 'delivery' ? input.selectedAddressId : null,
        delivery_mode: input.deliveryMode,
        payment_mode: resolvePlaceOrderPaymentMode(input.paymentMethod),
        special_instructions: input.specialInstructions,
        use_reward_points: input.useRewardPoints,
        coupon_code: input.couponCode ? input.couponCode.trim().toUpperCase() : null,
    };

    if (input.fulfillmentSlotStart) {
        payload.fulfillment_slot_start = input.fulfillmentSlotStart;
    }

    return payload;
}

/** The API refused the coupon while placing the order (used up, expired, minimum not met). */
export function isCouponRefusal(error: unknown): boolean {
    const data = (error as { response?: { data?: { coupon_code?: unknown } } } | null)?.response?.data;
    return Boolean(data?.coupon_code);
}
