'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import styles from './AddressForm.module.css';

export default function NewAddressPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        address_type: 'Home'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await apiService.addAddress(formData);
            router.back();
        } catch (error) {
            console.error(error);
            alert("Failed to add address");
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
                <h1>Add Address</h1>
                <div className="h-5" />
            </header>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                    <label>Address Type</label>
                    <select
                        name="address_type"
                        value={formData.address_type}
                        onChange={handleChange}
                        className={styles.select}
                    >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <label>Address Line 1</label>
                    <Input name="address_line1" value={formData.address_line1} onChange={handleChange} required />
                </div>

                <div className={styles.field}>
                    <label>Address Line 2 (Optional)</label>
                    <Input name="address_line2" value={formData.address_line2} onChange={handleChange} />
                </div>

                <div className="flex gap-4">
                    <div className={styles.field}>
                        <label>City</label>
                        <Input name="city" value={formData.city} onChange={handleChange} required />
                    </div>
                    <div className={styles.field}>
                        <label>State</label>
                        <Input name="state" value={formData.state} onChange={handleChange} required />
                    </div>
                </div>

                <div className={styles.field}>
                    <label>Pincode</label>
                    <Input name="pincode" value={formData.pincode} onChange={handleChange} required />
                </div>

                <Button type="submit" isLoading={isLoading} fullWidth>
                    Save Address
                </Button>
            </form>
        </div>
    );
}
