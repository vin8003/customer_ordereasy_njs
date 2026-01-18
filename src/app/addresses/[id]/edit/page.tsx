'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import MapPicker from '@/app/components/MapPicker';
import styles from '../../Addresses.module.css';

export default function EditAddressPage() {
    const router = useRouter();
    const params = useParams();
    const addressId = params.id as string;

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
            alert("Failed to load address");
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

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
        setIsSaving(true);
        try {
            await apiService.updateAddress(parseInt(addressId), formData);
            router.back();
        } catch (error) {
            console.error(error);
            alert("Failed to update address");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </Button>
                <h1>Edit Address</h1>
                <div className="w-10"></div>
            </header>

            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 bg-white min-h-[calc(100vh-60px)]">
                {/* Map Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <MapPicker
                        onLocationSelect={handleLocationSelect}
                        initialLat={formData.latitude}
                        initialLng={formData.longitude}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label (e.g. My Home)</label>
                    <Input name="title" value={formData.title} onChange={handleChange} placeholder="Home" required />
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                    <Input name="address_line1" value={formData.address_line1} onChange={handleChange} placeholder="House No, Building" required />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                    <Input name="address_line2" value={formData.address_line2} onChange={handleChange} placeholder="Street, Area" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <Input name="city" value={formData.city} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <Input name="state" value={formData.state} onChange={handleChange} required />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <Input name="pincode" value={formData.pincode} onChange={handleChange} placeholder="000000" required maxLength={6} />
                </div>

                <Button type="submit" isLoading={isSaving} fullWidth className="mt-4">
                    Update Address
                </Button>
            </form>
        </div>
    );
}
