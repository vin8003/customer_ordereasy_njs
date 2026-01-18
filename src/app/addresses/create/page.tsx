'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import styles from '../Addresses.module.css';
import MapPicker from '@/app/components/MapPicker';

export default function CreateAddressPage() {
    const router = useRouter();
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

    const handleLocationSelect = (lat: number, lng: number, address: string, pincode: string, city: string, state: string) => {
        setFormData(prev => ({
            ...prev,
            latitude: Number(lat.toFixed(8)),
            longitude: Number(lng.toFixed(8)),
            address_line1: address,
            pincode: pincode || prev.pincode,
            city: city || prev.city,
            state: state || prev.state
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await apiService.addAddress(formData);
            router.back();
        } catch (error) {
            console.error(error);
            alert("Failed to create address");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>Add New Address</h1>
                <div className="w-10"></div>
            </header>

            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 bg-white min-h-[calc(100vh-60px)]">
                {/* Map Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <MapPicker onLocationSelect={handleLocationSelect} />
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
                        <Input label="City" name="city" value={formData.city} onChange={handleChange} required />
                    </div>
                    <div>
                        <Input label="State" name="state" value={formData.state} onChange={handleChange} required />
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
