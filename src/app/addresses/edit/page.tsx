'use client';
import toast from '@/lib/toast';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import MapPicker from '@/app/components/MapPicker';
import { AVAILABLE_CITIES } from '@/config/cities';
import { matchAvailableCity } from '@/utils/location';
import { hasValidAddressCoordinates } from '@/utils/addressLocation';
import PageHeader from '@/app/components/PageHeader';
import styles from '../Addresses.module.css';

function EditAddressForm() {
    const router = useRouter();
    const { handleBack } = useAppNavigation();
    const searchParams = useSearchParams();
    const addressId = searchParams.get('id');

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        address_type: 'Home',
        latitude: 0,
        longitude: 0
    });

    useEffect(() => {
        if (addressId) {
            loadAddress(addressId);
        }
    }, [addressId]);

    const loadAddress = async (id: string) => {
        setIsLoading(true);
        try {
            const data = await apiService.getAddressDetail(id);
            setFormData({
                title: data.title || '',
                address_line1: data.address_line1 || '',
                address_line2: data.address_line2 || '',
                city: data.city || '',
                state: data.state || '',
                pincode: data.pincode || '',
                address_type: data.address_type || 'home',
                latitude: data.latitude ? parseFloat(data.latitude) : 0,
                longitude: data.longitude ? parseFloat(data.longitude) : 0
            });
        } catch (error) {
            console.error(error);
            // global error interceptor handles this
            console.error(error);
            handleBack();
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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
        if (!addressId) return;
        if (!hasValidAddressCoordinates(formData.latitude, formData.longitude)) {
            toast.error('Please set your location on the map before saving.');
            return;
        }
        setIsSaving(true);
        try {
            await apiService.updateAddress(parseInt(addressId), formData);
            handleBack();
        } catch (error) {
            console.error(error);
            // global error interceptor handles this
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <LoadingScreen message="Loading addresses..." />;

    return (
        <div className={styles.container}>
            <PageHeader title="Edit Address" onBack={handleBack} />

            <form onSubmit={handleSubmit} className={styles.formCard}>
                {/* Map Section */}
                <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">Location</label>
                    <MapPicker
                        onLocationSelect={handleLocationSelect}
                        initialLat={formData.latitude}
                        initialLng={formData.longitude}
                    />
                </div>
                <div>
                    <Input label="Label (e.g. My Home)" name="title" value={formData.title} onChange={handleChange} placeholder="Home" required />
                </div>

                <div>
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

                <div>
                    <Input label="Address Line 1" name="address_line1" value={formData.address_line1} onChange={handleChange} placeholder="House No, Building" required />
                </div>

                <div>
                    <Input label="Address Line 2" name="address_line2" value={formData.address_line2} onChange={handleChange} placeholder="Street, Area" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
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
                    <div>
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

                <div>
                    <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="000000" required maxLength={6} />
                </div>

                <Button type="submit" size="lg" isLoading={isSaving} fullWidth className="mt-2">
                    Update Address
                </Button>
            </form>
        </div>
    );
}

export default function EditAddressPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-[var(--ink-3)]">Loading...</div>}>
            <EditAddressForm />
        </Suspense>
    );
}
