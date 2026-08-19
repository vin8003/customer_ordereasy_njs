'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import { requestCurrentPosition, reverseGeocode } from '@/utils/location';

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
    const locationFetchedRef = useRef(false);

    const applyGeocode = useCallback(async (lat: number, lng: number) => {
        const geo = await reverseGeocode(lat, lng);
        if (geo) {
            onLocationSelect(lat, lng, geo.address, geo.pincode, geo.city, geo.state);
        }
    }, [onLocationSelect]);

    useEffect(() => {
        if (initialLat && initialLng) {
            setMarkerPos({ lat: initialLat, lng: initialLng });
            return;
        }
        if (isLoaded && !locationFetchedRef.current) {
            locationFetchedRef.current = true;
            const fetchLocation = async () => {
                const pos = await requestCurrentPosition();
                if (!pos) {
                    console.warn('Geolocation failed or denied.');
                    return;
                }
                setMarkerPos({ lat: pos.lat, lng: pos.lng });
                await applyGeocode(pos.lat, pos.lng);
            };
            fetchLocation();
        }
    }, [initialLat, initialLng, isLoaded, applyGeocode]);

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
        await applyGeocode(lat, lng);
    };

    if (!isLoaded) return <LoadingScreen message="Loading Map..." />;

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
                <span>Location is set from GPS. Tap the map only if you want to adjust the pin.</span>
            </div>
        </div>
    );
}
