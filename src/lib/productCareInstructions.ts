/** Optional top-level care_instructions on customer product detail. Display only. */

export type OptionalCareInstructions = string | null | undefined;

/** Trimmed care text for display, or null when the block must stay hidden. Never invents. */
export function formatVisibleCareInstructions(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
