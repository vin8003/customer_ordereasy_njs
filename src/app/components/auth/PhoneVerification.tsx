'use client';

import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { X, Phone, ShieldCheck, Loader2 } from 'lucide-react';

interface PhoneVerificationProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
    initialPhone?: string; // e.g. from user profile
}

export default function PhoneVerification({ isOpen, onClose, onVerified, initialPhone = '' }: PhoneVerificationProps) {
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [phone, setPhone] = useState(initialPhone);
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setStep('request');
            setError('');
            setLoading(false);
            setOtp('');
            // Ensure phone is consistent if passed
            if (initialPhone) setPhone(initialPhone);
        }
    }, [isOpen, initialPhone]);

    // Initialize Recaptcha
    useEffect(() => {
        if (!isOpen) return;

        try {
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'normal',
                    'callback': (response: any) => {
                        // reCAPTCHA solved, allow signInWithPhoneNumber.
                        // We handle this in handleSendOtp
                    },
                    'expired-callback': () => {
                        // Response expired. Ask user to solve reCAPTCHA again.
                        setError('Recaptcha expired, please try again.');
                    }
                });
                window.recaptchaVerifier.render();
            }
        } catch (e) {
            console.error("Recaptcha init error:", e);
        }

        return () => {
            // Cleanup if needed? Usually recaptcha instance persists.
            // Clearing it might cause issues on re-open.
        };
    }, [isOpen]);

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
            const appVerifier = window.recaptchaVerifier;

            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setStep('verify');
        } catch (err: any) {
            console.error("Error sending OTP:", err);
            setError(err.message || 'Failed to send OTP. Try again.');
            // Reset recaptcha
            if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (!confirmationResult) throw new Error("Session expired");

            const result = await confirmationResult.confirm(otp);
            const user = result.user;
            const token = await user.getIdToken();

            // Send to backend
            await apiService.verifyPhoneWithFirebase(phone, token);

            // Success
            onVerified();
            onClose();

        } catch (err: any) {
            console.error("Error verifying OTP:", err);
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '400px',
                position: 'relative',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <X size={24} color="#666" />
                </button>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={24} className="text-green-600" /> Verify Phone
                </h2>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px', borderRadius: '4px', marginBottom: '12px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                {step === 'request' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            We need to verify your phone number to proceed with the order.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Phone Number</label>
                            <div style={{ display: 'flex', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}>
                                <span style={{ color: '#666', marginRight: '8px' }}>+91</span>
                                <input
                                    type="tel"
                                    value={phone.replace('+91', '')}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter mobile number"
                                    style={{ border: 'none', outline: 'none', flex: 1 }}
                                    disabled={loading} // Fixed phone for now if user logged in? Maybe allow edit if profile allows.
                                />
                            </div>
                        </div>

                        <div id="recaptcha-container" style={{ margin: '0 auto' }}></div>

                        <Button onClick={handleSendOtp} disabled={loading} style={{ width: '100%' }}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
                        </Button>
                    </div>
                )}

                {step === 'verify' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            Enter the 6-digit code sent to <b>{phone}</b>
                        </p>

                        <div style={{ display: 'flex', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter OTP"
                                maxLength={6}
                                style={{ border: 'none', outline: 'none', flex: 1, textAlign: 'center', letterSpacing: '2px', fontSize: '18px' }}
                            />
                        </div>

                        <Button onClick={handleVerifyOtp} disabled={loading} style={{ width: '100%' }}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Verify Code'}
                        </Button>

                        <button
                            onClick={() => setStep('request')}
                            style={{ background: 'none', border: 'none', color: '#666', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Change Number / Resend
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

// Add global type for recaptcha
declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
