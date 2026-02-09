'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Check } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { AVAILABLE_CITIES, City } from '@/config/cities';
import styles from './CitySelection.module.css';

export default function CitySelectionPage() {
    const router = useRouter();
    // Default to the first available city (Bharatpur)
    const [selectedCity, setSelectedCity] = useState<City | null>(null);

    useEffect(() => {
        // Check if a city is already selected
        const storedCity = localStorage.getItem('selected_city');
        if (storedCity) {
            // Optional: Redirect if already selected? 
            // For now, let them re-select if they came here manually.
            try {
                const parsed = JSON.parse(storedCity);
                setSelectedCity(AVAILABLE_CITIES.find(c => c.id === parsed.id) || null);
            } catch (e) {
                console.error("Failed to parse stored city", e);
            }
        } else {
            // Auto-select Bharatpur as it's the only option
            const defaultCity = AVAILABLE_CITIES.find(c => c.isAvailable);
            if (defaultCity) {
                setSelectedCity(defaultCity);
            }
        }
    }, []);

    const handleCitySelect = (city: City) => {
        if (!city.isAvailable) return;
        setSelectedCity(city);
    };

    const handleConfirm = () => {
        if (selectedCity) {
            localStorage.setItem('selected_city', JSON.stringify(selectedCity));
            localStorage.setItem('selected_pincode', selectedCity.pincode);
            // Trigger storage event to update other components if needed
            window.dispatchEvent(new Event('storage'));
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
                    <h1>Select Your City</h1>
                    <p>Tell us where you are to find the best offers near you.</p>
                </div>

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
                    <p>Currently, services are available only in <strong>Bharatpur</strong> city.</p>
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
