/**
 * Optional top-level cart line `pack_size` (OE-342).
 * Display only — never invent from `unit`, nested `pack`, or camelCase `packSize`.
 * Brand display is OE-329 — do not retouch brand here.
 */

export type OptionalCartLinePackSize = string | number | null | undefined;

export function visibleCartLinePackSize(
    item: { pack_size?: OptionalCartLinePackSize } | null | undefined
): string | null {
    if (!item) return null;
    const value = item.pack_size;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
}
