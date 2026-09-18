/**
 * Top-level product `eco_friendly` for a compact Eco-friendly badge.
 * Display only — never invent from nested eco/sustainability objects or sibling flags.
 */

export const ECO_FRIENDLY_BADGE_LABEL = 'Eco-friendly';

export type ProductEcoFriendlyField = {
    eco_friendly?: boolean | null;
};

/** Badge label when top-level `eco_friendly` is strictly true; otherwise hidden. */
export function visibleProductEcoFriendlyBadge(
    product: ProductEcoFriendlyField | null | undefined
): string | null {
    if (!product || product.eco_friendly !== true) return null;
    return ECO_FRIENDLY_BADGE_LABEL;
}
