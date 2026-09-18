/** Optional top-level preorder_ship_date on customer product detail. Display only. */

export type OptionalPreorderShipDate = string | null | undefined;

/** ISO calendar date, optionally followed by a time suffix. */
const ISO_CALENDAR_PREFIX = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/;

function calendarDateFromIsoPrefix(trimmed: string): Date | null {
    const match = ISO_CALENDAR_PREFIX.exec(trimmed);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }
    return date;
}

/**
 * Formatted calendar date for display, or null when the line must stay hidden.
 * Accepts only a top-level ISO date / datetime string. Never invents a date.
 */
export function formatVisiblePreorderShipDate(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const date = calendarDateFromIsoPrefix(trimmed);
    if (!date) return null;
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}
