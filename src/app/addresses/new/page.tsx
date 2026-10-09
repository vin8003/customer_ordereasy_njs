'use client';
import toast from '@/lib/toast';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import MapPicker from '@/app/components/MapPicker';
import { AVAILABLE_CITIES } from '@/config/cities';
import { getPersistedLocation, matchAvailableCity } from '@/utils/location';
import { hasValidAddressCoordinates } from '@/utils/addressLocation';
import PageHeader from '@/app/components/PageHeader';
import styles from './AddressForm.module.css';

export default function NewAddressPage() {
    const router = useRouter();
    const { handleBack } = useAppNavigation();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        address_type: 'home',
        latitude: 0,
        longitude: 0
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        const loc = getPersistedLocation();
        if (!loc?.lat || !loc?.lng) return;
        const matched = matchAvailableCity(loc.name, loc.state);
        setFormData(prev => {
            if (prev.latitude || prev.longitude) return prev;
            return {
                ...prev,
                latitude: Number(loc.lat!.toFixed(8)),
                longitude: Number(loc.lng!.toFixed(8)),
                address_line1: loc.address || prev.address_line1,
                pincode: matched?.pincode || loc.pincode || prev.pincode,
                city: matched?.name || prev.city,
                state: matched?.state || loc.state || prev.state,
            };
        });
    }, []);

    const handleLocationSelect = (lat: number, lng: number, address: string, pincode: string, city: string, state: string) => {
        const matchedCity = matchAvailableCity(city, state);

        setFormData(prev => ({
            ...prev,
            latitude: Number(lat.toFixed(8)),
            longitude: Number(lng.toFixed(8)),
            address_line1: address,
            pincode: matchedCity?.pincode || pincode || prev.pincode,
            city: matchedCity ? matchedCity.name : prev.city,
            state: matchedCity ? matchedCity.state : prev.state
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasValidAddressCoordinates(formData.latitude, formData.longitude)) {
            toast.error('Please set your location on the map before saving.');
            return;
        }
        setIsLoading(true);
        try {
            await apiService.addAddress(formData);
            handleBack();
        } catch (error) {
            console.error(error);
            // global error interceptor handles this
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <PageHeader title="Add Address" onBack={handleBack} />

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">Location</label>
                    <MapPicker onLocationSelect={handleLocationSelect} initialLat={formData.latitude || undefined} initialLng={formData.longitude || undefined} />
                </div>

                <div className={styles.field}>
                    <Input label="Label (e.g. My Home)" name="title" value={formData.title} onChange={handleChange} required placeholder="Home" />
                </div>

                <div className={styles.field}>
                    <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">Address Type</label>
                    <select
                        name="address_type"
                        value={formData.address_type}
                        onChange={handleChange}
                        className="h-12 w-full appearance-none rounded-xl border border-[var(--line-strong)] bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235b6b83%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[position:right_14px_center] bg-no-repeat px-3.5 pr-10 text-[15px] text-[var(--ink)] hover:border-[var(--ink-4)] focus:border-[var(--brand-500)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-100)] disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--ink-4)]"
                    >
                        <option value="home">Home</option>
                        <option value="office">Office</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <Input label="Address Line 1" name="address_line1" value={formData.address_line1} onChange={handleChange} required placeholder="House No, Building" />
                </div>

                <div className={styles.field}>
                    <Input label="Address Line 2 (Optional)" name="address_line2" value={formData.address_line2} onChange={handleChange} placeholder="Street, Area" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className={styles.field}>
                        <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">State</label>
                        <select
                            name="state"
                            value={formData.state}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    state: e.target.value,
                                    city: '' // Reset city when state changes
                                });
                            }}
                            className="h-12 w-full appearance-none rounded-xl border border-[var(--line-strong)] bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235b6b83%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[position:right_14px_center] bg-no-repeat px-3.5 pr-10 text-[15px] text-[var(--ink)] hover:border-[var(--ink-4)] focus:border-[var(--brand-500)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-100)] disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--ink-4)]"
                            required
                        >
                            <option value="">Select State</option>
                            {Array.from(new Set(AVAILABLE_CITIES.map(c => c.state))).map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">City</label>
                        <select
                            name="city"
                            value={formData.city}
                            onChange={(e) => {
                                const city = AVAILABLE_CITIES.find(c => c.name === e.target.value);
                                setFormData({
                                    ...formData,
                                    city: e.target.value,
                                    pincode: city?.pincode || formData.pincode
                                });
                            }}
                            className="h-12 w-full appearance-none rounded-xl border border-[var(--line-strong)] bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235b6b83%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[position:right_14px_center] bg-no-repeat px-3.5 pr-10 text-[15px] text-[var(--ink)] hover:border-[var(--ink-4)] focus:border-[var(--brand-500)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-100)] disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--ink-4)]"
                            required
                            disabled={!formData.state}
                        >
                            <option value="">Select City</option>
                            {AVAILABLE_CITIES
                                .filter(c => c.state === formData.state && c.isAvailable)
                                .map(city => (
                                    <option key={city.id} value={city.name}>{city.name}</option>
                                ))
                            }
                        </select>
                    </div>
                </div>

                <div className={styles.field}>
                    <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} required maxLength={6} placeholder="000000" />
                </div>

                <Button type="submit" size="lg" isLoading={isLoading} fullWidth>
                    Save Address
                </Button>
            </form>
        </div>
    );
}
