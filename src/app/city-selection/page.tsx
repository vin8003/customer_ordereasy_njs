'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { City } from '@/config/cities';
import {
    INDIA_STATES,
    getCitiesForState,
    cityId,
    matchCity,
    matchState,
} from '@/config/india-locations';
import { persistManualCity } from '@/utils/location';
import { estimateCityFromIp } from '@/services/geoEstimate';
import { apiService } from '@/services/api';
import styles from './CitySelection.module.css';

export default function CitySelectionPage() {
    const router = useRouter();
    const [selectedState, setSelectedState] = useState('');
    const [selectedCityName, setSelectedCityName] = useState('');
    const [extraCity, setExtraCity] = useState<string | null>(null);
    const [pincode, setPincode] = useState<string | undefined>();
    /** City name the IP estimate attached a pincode to — cleared when user overrides. */
    const [estimatedCityForPin, setEstimatedCityForPin] = useState<string | null>(null);
    const [detectHint, setDetectHint] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);

    const citiesForState = (() => {
        if (!selectedState) return [];
        const base = getCitiesForState(selectedState);
        if (extraCity && !base.includes(extraCity)) return [...base, extraCity];
        return base;
    })();

    useEffect(() => {
        const storedCity = localStorage.getItem('selected_city');
        if (storedCity) {
            try {
                const parsed: City = JSON.parse(storedCity);
                const state = matchState(parsed.state) || parsed.state;
                const city =
                    matchCity(parsed.name, state) || parsed.name;
                setSelectedState(state);
                setSelectedCityName(city);
                if (city && !getCitiesForState(state).includes(city)) {
                    setExtraCity(city);
                }
                if (parsed.pincode) setPincode(parsed.pincode);
                return;
            } catch (e) {
                console.error('Failed to parse stored city', e);
            }
        }

        let cancelled = false;
        (async () => {
            setIsDetecting(true);
            try {
                let estimate = await estimateCityFromIp();
                if (!estimate) {
                    try {
                        const be = await apiService.geoEstimate();
                        if (be?.city || be?.state) {
                            estimate = {
                                city: matchCity(be.city, matchState(be.state) || be.state),
                                state: matchState(be.state) || be.state,
                                pincode: be.pincode,
                                guessedCityName: be.city,
                                source: 'backend',
                            };
                        }
                    } catch {
                        // silent
                    }
                }
                if (cancelled || !estimate) return;

                const state = estimate.state || '';
                let city = estimate.city;
                if (!city && estimate.guessedCityName && state) {
                    city = estimate.guessedCityName;
                    setExtraCity(estimate.guessedCityName);
                }
                if (state) setSelectedState(state);
                if (city) setSelectedCityName(city);
                if (estimate.pincode && city) {
                    setPincode(estimate.pincode);
                    setEstimatedCityForPin(city);
                }

                const labelCity = city || estimate.guessedCityName;
                if (labelCity && state) {
                    setDetectHint(
                        `Detected near ${labelCity}, ${state} — change if needed.`
                    );
                } else if (state) {
                    setDetectHint(
                        `Detected near ${state} — select your city.`
                    );
                }
            } finally {
                if (!cancelled) setIsDetecting(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const clearEstimatedPincode = () => {
        setPincode(undefined);
        setEstimatedCityForPin(null);
    };

    const handleStateChange = (state: string) => {
        setSelectedState(state);
        setSelectedCityName('');
        setExtraCity(null);
        setDetectHint('');
        clearEstimatedPincode();
    };

    const handleCityChange = (cityName: string) => {
        setSelectedCityName(cityName);
        setDetectHint('');
        if (!cityName || cityName !== estimatedCityForPin) {
            clearEstimatedPincode();
        }
    };

    const handleConfirm = () => {
        if (!selectedState || !selectedCityName) return;
        const pin =
            pincode && selectedCityName === estimatedCityForPin ? pincode : undefined;
        const city: City = {
            id: cityId(selectedCityName, selectedState),
            name: selectedCityName,
            state: selectedState,
            isAvailable: true,
            ...(pin ? { pincode: pin } : {}),
        };
        persistManualCity(city);
        if (pin) {
            localStorage.setItem('selected_pincode', pin);
        } else {
            localStorage.removeItem('selected_pincode');
        }
        window.dispatchEvent(new Event('storage'));
        router.push('/retailers');
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

                <div className={styles.formFields}>
                    <div className={styles.field}>
                        <label htmlFor="state">State</label>
                        <select
                            id="state"
                            value={selectedState}
                            onChange={(e) => handleStateChange(e.target.value)}
                            className={styles.select}
                        >
                            <option value="">Select State</option>
                            {INDIA_STATES.map((state) => (
                                <option key={state} value={state}>
                                    {state}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="city">City</label>
                        <select
                            id="city"
                            value={selectedCityName}
                            onChange={(e) => handleCityChange(e.target.value)}
                            disabled={!selectedState}
                            className={styles.select}
                        >
                            <option value="">
                                {selectedState ? 'Select City' : 'Select state first'}
                            </option>
                            {citiesForState.map((city) => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {isDetecting && (
                    <p className={styles.detectHint}>Detecting your city…</p>
                )}
                {!isDetecting && detectHint && (
                    <p className={styles.detectHint}>{detectHint}</p>
                )}

                <div className={styles.footer}>
                    <Button
                        fullWidth
                        onClick={handleConfirm}
                        disabled={!selectedState || !selectedCityName}
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
