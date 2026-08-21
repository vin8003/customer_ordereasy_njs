'use client';
import toast from 'react-hot-toast';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { ArrowLeft } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import styles from '../Addresses.module.css';
import MapPicker from '@/app/components/MapPicker';
import { AVAILABLE_CITIES } from '@/config/cities';
import { getPersistedLocation, matchAvailableCity } from '@/utils/location';

export default function CreateAddressPage() {
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
            <header className={styles.header}>
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>Add New Address</h1>
                <div className="w-10"></div>
            </header>

            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 bg-white min-h-[calc(100vh-60px)]">
                {/* Map Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <MapPicker onLocationSelect={handleLocationSelect} initialLat={formData.latitude || undefined} initialLng={formData.longitude || undefined} />
                </div>
                <div>
                    <Input label="Label (e.g. My Home)" name="title" value={formData.title} onChange={handleChange} placeholder="Home" required />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                    <select
                        name="address_type"
                        value={formData.address_type}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
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
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select State</option>
                            {Array.from(new Set(AVAILABLE_CITIES.map(c => c.state))).map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
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
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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

                <Button type="submit" isLoading={isLoading} fullWidth className="mt-4">
                    Save Address
                </Button>
            </form>
        </div>
    );
}
