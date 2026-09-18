/** Optional top-level `coupon_code` on customer order detail. Display only. */

export function visibleOrderCouponCode(order: unknown): string | null {
    if (!order || typeof order !== 'object') return null;
    const code = (order as { coupon_code?: unknown }).coupon_code;
    if (typeof code !== 'string') return null;
    const trimmed = code.trim();
    return trimmed === '' ? null : trimmed;
}
