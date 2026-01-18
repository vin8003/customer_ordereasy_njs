'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';

export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-green-600" />
            </div>

            <h1 className="text-2xl font-bold mb-2 text-gray-900">Order Placed Successfully!</h1>
            <p className="text-gray-500 mb-8">
                Thank you for your order. We will deliver it to you shortly.
            </p>

            <Link href="/orders" className="w-full max-w-xs mb-4">
                <Button variant="outline" fullWidth>View My Orders</Button>
            </Link>

            <Link href="/retailers" className="w-full max-w-xs">
                <Button fullWidth>Continue Shopping</Button>
            </Link>
        </div>
    );
}
