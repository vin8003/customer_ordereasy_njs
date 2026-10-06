const MEDIA_HOST = 'https://api.ordereasy.win';

/** Backend ImageFields can come back relative (e.g. `/media/...`); make them absolute. */
export function resolveMediaUrl(path?: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${MEDIA_HOST}${path.startsWith('/') ? '' : '/'}${path}`;
}
