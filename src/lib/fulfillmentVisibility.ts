/** Pure helpers (no path aliases) so they can be unit tested with node --test. */

const CLOSED_ORDER_STATUSES = new Set(['delivered', 'cancelled', 'returned']);

/** A pickup code or courier contact is only useful while the order is still open. */
export function isOrderOpenForFulfillment(status: string | undefined): boolean {
    return !CLOSED_ORDER_STATUSES.has(String(status ?? '').toLowerCase());
}

/** Keep digits and a leading + only, so the tel: link cannot carry extra parameters. */
export function telHref(phone: string | null | undefined): string | null {
    const cleaned = String(phone ?? '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    return cleaned.replace(/\D/g, '').length >= 7 ? `tel:${cleaned}` : null;
}
