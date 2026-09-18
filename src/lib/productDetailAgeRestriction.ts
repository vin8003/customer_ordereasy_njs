/** Optional top-level age_restriction on customer product detail. Display only. */

export type OptionalAgeRestriction = string | null | undefined;

/** Trimmed age restriction for the detail badge, or null when it must stay hidden. Never invents. */
export function formatVisibleAgeRestriction(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
