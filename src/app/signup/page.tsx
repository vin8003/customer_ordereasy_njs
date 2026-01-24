'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { apiService, setAuthToken } from '../../services/api';
import styles from './Signup.module.css';
import { Phone, Lock, User, Mail } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await apiService.signup({
                username: formData.username,
                email: formData.email,
                phone_number: formData.phone,
                password: formData.password,
                password_confirm: formData.confirmPassword, // Updated to match API expectation
            });

            if (response && response.tokens) {
                setAuthToken(response.tokens.access, response.tokens.refresh);
                router.push('/'); // Redirect to Home or Verification based on flow
            } else {
                // Handle case where tokens might not be returned immediately (verification needed)
                router.push('/login');
            }

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                // Format errors from Django
                const errorData = err.response.data;
                let errorMessage = 'Signup failed.';
                if (typeof errorData === 'object') {
                    errorMessage = Object.entries(errorData)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('\n');
                }
                setError(errorMessage);

            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logoWrapper}>
                        <Image
                            src="/assets/images/logo.png"
                            alt="BuyEasy Logo"
                            width={100}
                            height={100}
                            className={styles.logo}
                        />
                    </div>
                    <h1 className={styles.title}>Create Account</h1>
                    <p className={styles.subtitle}>Join us and start shopping!</p>
                </div>

                <form onSubmit={handleSignup} className={styles.form}>
                    {error && <div className={styles.errorAlert}>{error}</div>}

                    <Input
                        label="Username"
                        placeholder="Choose a username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        icon={<User size={18} />}
                        required
                    />

                    <Input
                        label="Email"
                        placeholder="Enter your email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        icon={<Mail size={18} />}
                        required
                    />

                    <Input
                        label="Phone Number"
                        placeholder="Enter 10 digit number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        type="tel"
                        icon={<Phone size={18} />}
                        maxLength={10}
                        required
                    />

                    <Input
                        label="Password"
                        placeholder="Create a password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        type="password"
                        icon={<Lock size={18} />}
                        required
                    />

                    <Input
                        label="Confirm Password"
                        placeholder="Confirm your password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        type="password"
                        icon={<Lock size={18} />}
                        required
                    />

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        fullWidth
                        className={styles.signupBtn}
                    >
                        Sign Up
                    </Button>
                </form>

                <div className={styles.footer}>
                    <p>Already have an account?</p>
                    <Link href="/login" className={styles.loginLink}>Log In</Link>
                </div>
            </div>
        </div>
    );
}
