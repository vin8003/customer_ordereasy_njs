/** Optional top-level tags on customer product detail. Display only. */

export type OptionalProductTags = unknown;

/** Trimmed non-empty string tags from a top-level array. Never invents. */
export function getVisibleProductTags(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const visible: string[] = [];
    for (const item of value) {
        if (typeof item !== 'string') continue;
        const trimmed = item.trim();
        if (trimmed) visible.push(trimmed);
    }
    return visible;
}
