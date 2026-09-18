/** Optional top-level short_description on customer product detail. Display only. */

export type OptionalShortDescription = string | null | undefined;

/** Trimmed short description for display, or null when the line must stay hidden. Never invents. */
export function formatVisibleShortDescription(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
