/** API host (also serves /media). Override with NEXT_PUBLIC_API_BASE_URL, e.g. for CI builds; defaults to live. */
export const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.ordereasy.win').replace(/\/$/, '');

/** Backend ImageFields can come back relative (e.g. `/media/...`); make them absolute. */
export function resolveMediaUrl(path?: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
