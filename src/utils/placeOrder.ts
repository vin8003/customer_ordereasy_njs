export interface PlaceOrderInput {
    retailerId: string;
    deliveryMode: 'delivery' | 'pickup';
    selectedAddressId: number | null;
    paymentMethod: string;
    specialInstructions: string;
    useRewardPoints: boolean;
}

export interface PlaceOrderPayload {
    retailer_id: number;
    delivery_mode: 'delivery' | 'pickup';
    payment_mode: string;
    special_instructions: string;
    use_reward_points: boolean;
    address_id?: number;
}

export function resolvePlaceOrderPaymentMode(
    paymentMethod: string,
    deliveryMode: 'delivery' | 'pickup'
): string {
    if (paymentMethod === 'upi') return 'upi';
    if (deliveryMode === 'pickup') return 'cash_pickup';
    return 'cash';
}

export function buildPlaceOrderPayload(input: PlaceOrderInput): PlaceOrderPayload {
    const retailerId = parseInt(input.retailerId, 10);
    if (!Number.isFinite(retailerId) || retailerId <= 0) {
        throw new Error('Invalid retailer session. Please return to the shop and try again.');
    }

    const payload: PlaceOrderPayload = {
        retailer_id: retailerId,
        delivery_mode: input.deliveryMode,
        payment_mode: resolvePlaceOrderPaymentMode(input.paymentMethod, input.deliveryMode),
        special_instructions: input.specialInstructions.trim(),
        use_reward_points: Boolean(input.useRewardPoints),
    };

    if (input.deliveryMode === 'delivery' && input.selectedAddressId) {
        payload.address_id = input.selectedAddressId;
    }

    return payload;
}
