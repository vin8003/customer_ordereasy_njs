'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin, Navigation } from 'lucide-react';
import { requestCurrentPosition, reverseGeocode } from '@/utils/location';
import { hasValidAddressCoordinates } from '@/utils/addressLocation';

const containerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '12px'
};

const defaultCenter = {
    lat: 12.9716,
    lng: 77.5946
};

const libraries: ("places")[] = ["places"];

interface MapPickerProps {
    onLocationSelect: (lat: number, lng: number, address: string, pincode: string, city: string, state: string) => void;
    initialLat?: number;
    initialLng?: number;
}

export default function MapPicker({ onLocationSelect, initialLat, initialLng }: MapPickerProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const hasInitialCoords = hasValidAddressCoordinates(initialLat ?? 0, initialLng ?? 0);
    const [markerPos, setMarkerPos] = useState(
        hasInitialCoords
            ? { lat: initialLat!, lng: initialLng! }
            : defaultCenter
    );
    const [isLocating, setIsLocating] = useState(false);
    const [locationSet, setLocationSet] = useState(hasInitialCoords);
    const locationFetchedRef = useRef(false);

    const applyGeocode = useCallback(async (lat: number, lng: number) => {
        const geo = await reverseGeocode(lat, lng);
        if (geo) {
            setLocationSet(true);
            onLocationSelect(lat, lng, geo.address, geo.pincode, geo.city, geo.state);
        }
    }, [onLocationSelect]);

    useEffect(() => {
        if (hasInitialCoords) {
            setMarkerPos({ lat: initialLat!, lng: initialLng! });
            setLocationSet(true);
        }
    }, [initialLat, initialLng, hasInitialCoords]);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    const handleMapClick = async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        setMarkerPos({ lat, lng });
        await applyGeocode(lat, lng);
    };

    const handleUseMyLocation = async () => {
        if (locationFetchedRef.current && isLocating) return;
        locationFetchedRef.current = true;
        setIsLocating(true);
        try {
            const pos = await requestCurrentPosition();
            if (!pos) {
                return;
            }
            const next = { lat: pos.lat, lng: pos.lng };
            setMarkerPos(next);
            map?.panTo(next);
            await applyGeocode(pos.lat, pos.lng);
        } finally {
            setIsLocating(false);
        }
    };

    if (!isLoaded) return <LoadingScreen message="Loading Map..." />;

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="mb-3 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
            >
                <Navigation size={18} />
                {isLocating ? 'Getting your location…' : 'Use my location'}
            </button>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={markerPos}
                zoom={15}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                }}
            >
                <Marker position={markerPos} />
            </GoogleMap>
            <div className="mt-2 text-xs text-center text-gray-500 flex items-center justify-center gap-1">
                <MapPin size={12} />
                <span>
                    {locationSet
                        ? 'Tap the map to adjust the pin if needed.'
                        : 'Use the button above or tap the map to set your delivery location.'}
                </span>
            </div>
        </div>
    );
}
