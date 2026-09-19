export function hasValidAddressCoordinates(latitude: number, longitude: number): boolean {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    if (lat === 0 && lng === 0) return false;
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
