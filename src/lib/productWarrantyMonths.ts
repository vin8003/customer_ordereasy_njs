/** Optional top-level warranty_months on customer product detail. Display only. */

export type OptionalWarrantyMonths = string | number | null | undefined;

const NUMERIC_STRING = /^-?\d+(\.\d+)?$/;

/** Finite month count when the API sent a parseable value other than 0; otherwise null. */
export function parseVisibleWarrantyMonths(value: unknown): number | null {
    let n: number | null = null;
    if (typeof value === 'number') {
        n = Number.isFinite(value) ? value : null;
    } else if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed || !NUMERIC_STRING.test(trimmed)) return null;
        const parsed = Number(trimmed);
        n = Number.isFinite(parsed) ? parsed : null;
    }
    if (n == null || n <= 0) return null;
    return n;
}

/**
 * Warranty line for display, or null when the line must stay hidden.
 * Top-level finite number / numeric string only. Never invents from nested
 * `warranty` objects, camelCase `warrantyMonths`, or prose like "12 months".
 */
export function formatVisibleWarrantyMonths(value: unknown): string | null {
    const n = parseVisibleWarrantyMonths(value);
    if (n == null) return null;
    const count = String(n);
    return n === 1 ? `${count} month warranty` : `${count} months warranty`;
}
