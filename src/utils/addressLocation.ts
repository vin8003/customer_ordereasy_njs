export function parseCoordinate(value?: number | string | null): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function hasValidAddressCoordinates(latitude: number, longitude: number): boolean {
    const lat = parseCoordinate(latitude);
    const lng = parseCoordinate(longitude);
    if (lat === 0 && lng === 0) return false;
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
