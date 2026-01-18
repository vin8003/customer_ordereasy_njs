'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import styles from './Checkout.module.css';

interface Address {
    id: number;
    address_line1: string;
    city: string;
    state: string;
    pincode: string;
    address_type: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [isLoading, setIsLoading] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);

    // Ideally pass retailer_id from cart or context
    // For now assuming we are checking out the current active cart
    // We need to fetch cart to display summary or at least total

    useEffect(() => {
        loadAddresses();
        loadCartSummary();
    }, []);

    const loadAddresses = async () => {
        try {
            const data = await apiService.getAddresses();
            setAddresses(data);
            if (data.length > 0) {
                setSelectedAddressId(data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadCartSummary = async () => {
        // Here we might need the retailer ID to fetch the specific cart
        // If we don't have it, we might need a "get active cart" endpoint or logic
        // For MVP, assuming user comes from Cart page which had a retailer context.
        // Let's rely on stored retailer id from localStorage for now (from CartPage logic)
        const storedId = localStorage.getItem('current_retailer_id');
        if (storedId) {
            try {
                const data = await apiService.getCart(storedId);
                setCartTotal(parseFloat(data.total_amount));
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            alert("Please select a delivery address.");
            return;
        }

        const storedId = localStorage.getItem('current_retailer_id');
        if (!storedId) {
            alert("Retailer session lost. Please go back to cart.");
            return;
        }

        setIsLoading(true);
        try {
            await apiService.placeOrder({
                retailer_id: storedId,
                address_id: selectedAddressId,
                payment_method: paymentMethod
                // Backend might infer cart items or we need to pass them?
                // Usually 'place_order' view takes items from server-side cart or expects them in payload.
                // Looking at standard implementations, it often takes current cart.
            });

            // Success
            router.push('/checkout/success');
        } catch (error) {
            console.error(error);
            alert("Failed to place order. Please try again.");
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
                <h1>Checkout</h1>
                <div className="h-5" />
            </header>

            <main className={styles.main}>
                {/* Address Selection */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Delivery Address</h2>
                    {addresses.length === 0 ? (
                        <div className="text-center p-4 border rounded-lg border-dashed">
                            <p className="mb-2 text-sm text-gray-500">No address found</p>
                            <Button onClick={() => router.push('/addresses/new')}>Add Address</Button>
                        </div>
                    ) : (
                        <div className={styles.addressList}>
                            {addresses.map(addr => (
                                <div
                                    key={addr.id}
                                    className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.selected : ''}`}
                                    onClick={() => setSelectedAddressId(addr.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 ${selectedAddressId === addr.id ? 'text-primary' : 'text-gray-400'}`}>
                                            {selectedAddressId === addr.id ? <CheckCircle size={20} className="fill-blue-100 text-blue-600" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                                        </div>
                                        <div>
                                            <span className={styles.addressType}>{addr.address_type}</span>
                                            <p className={styles.addressText}>
                                                {addr.address_line1}, {addr.city}, {addr.pincode}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" className="text-primary text-sm mt-2" onClick={() => router.push('/addresses/new')}>
                                + Add New Address
                            </Button>
                        </div>
                    )}
                </section>

                {/* Payment Method */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Payment Method</h2>
                    <div className={styles.paymentOptions}>
                        <div
                            className={`${styles.paymentCard} ${paymentMethod === 'cod' ? styles.selected : ''}`}
                            onClick={() => setPaymentMethod('cod')}
                        >
                            <span className="font-bold">Cash on Delivery</span>
                            {paymentMethod === 'cod' && <CheckCircle size={18} className="text-blue-600" />}
                        </div>
                        {/* Add UPI/Card later */}
                        <div className={`${styles.paymentCard} opacity-50 cursor-not-allowed`}>
                            <span className="font-bold">UPI / One Click (Coming Soon)</span>
                        </div>
                    </div>
                </section>

                {/* Summary */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Order Summary</h2>
                    <div className="flex justify-between items-center py-2 border-t border-dashed border-gray-200">
                        <span className="font-bold text-lg">Total Amount</span>
                        <span className="font-bold text-xl text-primary">₹{cartTotal.toFixed(2)}</span>
                    </div>
                </section>
            </main>

            <div className={styles.footer}>
                <Button fullWidth onClick={handlePlaceOrder} isLoading={isLoading}>
                    Place Order (₹{cartTotal.toFixed(2)})
                </Button>
            </div>
        </div>
    );
}
