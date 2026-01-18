'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

const containerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '12px'
};

const defaultCenter = {
    lat: 12.9716, // Bangalore default
    lng: 77.5946
};

// Libraries to load - must be stable array ref
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
    const [markerPos, setMarkerPos] = useState(defaultCenter);

    useEffect(() => {
        if (initialLat && initialLng) {
            setMarkerPos({ lat: initialLat, lng: initialLng });
        } else {
            // Try getting current location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setMarkerPos({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    () => {
                        console.warn("Geolocation failed or denied.");
                    }
                );
            }
        }
    }, [initialLat, initialLng]);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    const handleMapClick = async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        setMarkerPos({ lat, lng });

        // Reverse Geocode
        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });

            if (response.results[0]) {
                const result = response.results[0];
                const fullAddress = result.formatted_address;

                // Extract components
                let pincode = '';
                let city = '';
                let state = '';

                result.address_components.forEach(comp => {
                    if (comp.types.includes('postal_code')) pincode = comp.long_name;
                    if (comp.types.includes('locality')) city = comp.long_name;
                    if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                });

                onLocationSelect(lat, lng, fullAddress, pincode, city, state);
            }
        } catch (error) {
            console.error("Geocoding failed", error);
        }
    };

    if (!isLoaded) return <div className="h-[300px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">Loading Map...</div>;

    return (
        <div className="relative w-full">
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
                <span>Tap on map to select precise location</span>
            </div>
        </div>
    );
}
