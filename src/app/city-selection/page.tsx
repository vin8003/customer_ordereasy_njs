'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Check, LocateFixed } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { AVAILABLE_CITIES, City } from '@/config/cities';
import {
    getPersistedLocation,
    persistManualCity,
    requestAndPersistLocation,
} from '@/utils/location';
import styles from './CitySelection.module.css';

export default function CitySelectionPage() {
    const router = useRouter();
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [locateError, setLocateError] = useState('');

    const handleUseLocation = async () => {
        setIsLocating(true);
        setLocateError('');
        try {
            const loc = await requestAndPersistLocation();
            if (loc) {
                router.replace('/retailers');
                return;
            }
            setLocateError('Could not confirm a service city from GPS. Please select your city to continue.');
        } finally {
            setIsLocating(false);
        }
    };

    useEffect(() => {
        const stored = getPersistedLocation();
        if (stored) {
            const match = AVAILABLE_CITIES.find((c) => c.id === stored.id)
                || AVAILABLE_CITIES.find((c) => c.name === stored.name);
            setSelectedCity(match || null);
        }
        // Do not auto-select Bharatpur. Ask GPS here if home has not already prompted.
        if (!sessionStorage.getItem('location_prompted')) {
            sessionStorage.setItem('location_prompted', '1');
            handleUseLocation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCitySelect = (city: City) => {
        if (!city.isAvailable) return;
        setSelectedCity(city);
        setLocateError('');
    };

    const handleConfirm = () => {
        if (selectedCity) {
            persistManualCity(selectedCity);
            router.push('/retailers');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <MapPin size={48} className={styles.icon} />
                    </div>
                    <h1>Where are you?</h1>
                    <p>We use your location to show nearby stores. Pickup and delivery both work without dropping a map pin.</p>
                </div>

                <button
                    type="button"
                    className={styles.locateBtn}
                    onClick={handleUseLocation}
                    disabled={isLocating}
                >
                    <LocateFixed size={18} />
                    {isLocating ? 'Detecting location...' : 'Use my current location'}
                </button>
                {locateError && <p className={styles.locateError}>{locateError}</p>}

                <div className={styles.cityList}>
                    {AVAILABLE_CITIES.map((city) => (
                        <div
                            key={city.id}
                            className={`${styles.cityCard} ${selectedCity?.id === city.id ? styles.selected : ''} ${!city.isAvailable ? styles.disabled : ''}`}
                            onClick={() => handleCitySelect(city)}
                        >
                            <div className={styles.cityInfo}>
                                <h2>{city.name}</h2>
                                <p>{city.state} - {city.pincode}</p>
                            </div>
                            {selectedCity?.id === city.id && (
                                <div className={styles.checkIcon}>
                                    <Check size={20} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className={styles.infoMessage}>
                    <p>Or pick a city if you prefer not to share location.</p>
                </div>

                <div className={styles.footer}>
                    <Button
                        fullWidth
                        onClick={handleConfirm}
                        disabled={!selectedCity}
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
