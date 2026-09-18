/** Optional `flash_sale_ends_at` countdown on product. Display only; do not invent a sale. */

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

/** Epoch ms when the API sent a parseable ISO datetime; otherwise null. */
export function parseFlashSaleEndsAt(value: unknown): number | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const ms = Date.parse(trimmed);
    return Number.isFinite(ms) ? ms : null;
}

/** Remaining ms while the sale is still open; otherwise null (hide). */
export function getFlashSaleRemainingMs(endsAtMs: number, nowMs: number): number | null {
    if (!Number.isFinite(endsAtMs) || !Number.isFinite(nowMs)) return null;
    const remaining = endsAtMs - nowMs;
    return remaining > 0 ? remaining : null;
}

/** Compact remaining-time copy. Largest unit is unpadded; smaller units are zero-padded. */
export function formatFlashSaleRemaining(remainingMs: number): string {
    const totalSeconds = Math.max(0, Math.floor(remainingMs / MS_PER_SECOND));
    const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
    const hours = Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
    const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const seconds = totalSeconds % SECONDS_PER_MINUTE;

    if (days > 0) return `${days}d ${hours}h ${pad2(minutes)}m`;
    if (hours > 0) return `${hours}h ${pad2(minutes)}m ${pad2(seconds)}s`;
    if (minutes > 0) return `${minutes}m ${pad2(seconds)}s`;
    return `${seconds}s`;
}

/** Customer-facing label, or null when the field is absent, invalid, or expired. */
export function getFlashSaleCountdownLabel(value: unknown, nowMs: number = Date.now()): string | null {
    const endsAtMs = parseFlashSaleEndsAt(value);
    if (endsAtMs == null) return null;
    const remaining = getFlashSaleRemainingMs(endsAtMs, nowMs);
    if (remaining == null) return null;
    return `Flash sale ends in ${formatFlashSaleRemaining(remaining)}`;
}
