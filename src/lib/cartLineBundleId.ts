/**
 * Optional top-level cart line `bundle_id`.
 * Display only — never invent from nested `bundle`, camelCase `bundleId`, or brand (OE-329).
 */

export type OptionalCartLineBundleId = string | number | null | undefined;

export function visibleCartLineBundleId(
    item: { bundle_id?: OptionalCartLineBundleId } | null | undefined
): string | null {
    if (!item) return null;
    const value = item.bundle_id;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
}
