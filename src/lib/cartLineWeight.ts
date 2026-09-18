/**
 * Optional top-level cart line `weight` (display only).
 * Brand is OE-329 — do not read or invent `brand_name` here.
 * Never invent a label from pack_size, unit, or a nested weight object.
 */

export type OptionalCartLineWeight = string | number | null | undefined;

export function visibleCartLineWeight(
    item: { weight?: OptionalCartLineWeight } | null | undefined
): string | null {
    if (!item) return null;
    const value = item.weight;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
}
