'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import styles from './ProfileEdit.module.css';

export default function EditProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: ''
    });

    useEffect(() => {
        apiService.fetchUserProfile().then(data => {
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || '',
                phone_number: data.phone_number || ''
            });
        });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await apiService.updateUserProfile(formData);
            alert("Profile updated successfully!");
            router.back();
        } catch (error) {
            console.error(error);
            alert("Failed to update profile.");
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
                <h1>Edit Profile</h1>
                <div className="h-5" />
            </header>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                    <label>First Name</label>
                    <Input
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                    />
                </div>
                <div className={styles.field}>
                    <label>Last Name</label>
                    <Input
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                    />
                </div>
                <div className={styles.field}>
                    <label>Email</label>
                    <Input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                    />
                </div>
                {/* Phone is usually read-only or requires OTP */}

                <Button type="submit" isLoading={isLoading} fullWidth>
                    Save Changes
                </Button>
            </form>
        </div>
    );
}
