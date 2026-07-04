'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

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

    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        if (typeof google === 'undefined' || !google.maps) return;
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
    }, [onLocationSelect]);

    useEffect(() => {
        if (initialLat && initialLng) {
            setMarkerPos({ lat: initialLat, lng: initialLng });
        } else if (isLoaded && !locationFetchedRef.current) {
            locationFetchedRef.current = true;
            const fetchLocation = async () => {
                if (Capacitor.isNativePlatform()) {
                    try {
                        let permStatus = await Geolocation.checkPermissions();
                        if (permStatus.location !== 'granted') {
                            permStatus = await Geolocation.requestPermissions();
                        }
                        if (permStatus.location === 'granted') {
                            const position = await Geolocation.getCurrentPosition();
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            setMarkerPos({ lat, lng });
                            await reverseGeocode(lat, lng);
                        }
                    } catch (e) {
                        console.warn("Native geolocation failed or denied.", e);
                    }
                } else {
                    // Try getting current location via browser API
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            async (position) => {
                                const lat = position.coords.latitude;
                                const lng = position.coords.longitude;
                                setMarkerPos({ lat, lng });
                                await reverseGeocode(lat, lng);
                            },
                            () => {
                                console.warn("Geolocation failed or denied.");
                            }
                        );
                    }
                }
            };
            fetchLocation();
        }
    }, [initialLat, initialLng, isLoaded, reverseGeocode]);

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
        await reverseGeocode(lat, lng);
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
                <span>Tap on map to select precise location</span>
            </div>
        </div>
    );
}
