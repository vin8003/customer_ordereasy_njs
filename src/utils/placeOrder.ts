export interface PlaceOrderInput {
    retailerId: string;
    deliveryMode: 'delivery' | 'pickup';
    selectedAddressId: number | null;
    paymentMethod: string;
    specialInstructions: string;
    useRewardPoints: boolean;
    couponCode?: string | null;
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

    return {
        retailer_id: retailerId,
        address_id: input.deliveryMode === 'delivery' ? input.selectedAddressId : null,
        delivery_mode: input.deliveryMode,
        payment_mode: resolvePlaceOrderPaymentMode(input.paymentMethod),
        special_instructions: input.specialInstructions,
        use_reward_points: input.useRewardPoints,
        coupon_code: input.couponCode ? input.couponCode.trim().toUpperCase() : null,
    };
}
