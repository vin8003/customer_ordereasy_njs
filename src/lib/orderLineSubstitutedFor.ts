/**
 * Optional top-level order line `substituted_for` (customer order detail).
 * Display only — never invent from camelCase `substitutedFor`, `original_product`,
 * nested `substitution`, or sibling item fields.
 */

export type OptionalSubstitutedFor = string | number | null | undefined;

export interface OrderLineOptionalSubstitutedFor {
    /** API may send junk; only a trimmed string or finite number is shown. */
    substituted_for?: unknown;
    /** Allowed on payloads / tests; never used to invent substituted_for. */
    substitutedFor?: unknown;
    original_product?: unknown;
    original_name?: unknown;
    replaced_item?: unknown;
    substitution?: unknown;
}

function asTrimmedLabel(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
}

/**
 * Trimmed top-level `substituted_for` for display, or null when the line must stay hidden.
 * Absent / undefined / null / blank / non-string / non-finite → do not show.
 */
export function visibleOrderLineSubstitutedFor(
    item: OrderLineOptionalSubstitutedFor | null | undefined
): string | null {
    if (!item) return null;
    return asTrimmedLabel(item.substituted_for);
}
