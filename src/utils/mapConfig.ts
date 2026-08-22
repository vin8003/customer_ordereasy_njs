/** Tiny helper so `/retailers` can know if Maps is configured without importing GoogleMap. */
export function isMapConfigured(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
}
