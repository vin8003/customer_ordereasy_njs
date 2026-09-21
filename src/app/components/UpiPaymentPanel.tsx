'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import toast from '@/lib/toast';
import { Button } from '@/app/components/ui/Button';
import {
    buildUpiPayUri,
    getPayableAmount,
    isDesktopBrowser,
    isUpiAppLaunchSupported,
    openUpiPayment,
} from '@/utils/upiPay';
import styles from '../orders/detail/OrderDetails.module.css';

interface UpiPaymentPanelProps {
    retailerUpiId?: string;
    retailerName: string;
    orderNumber: string;
    netAmount?: string;
    totalAmount: string;
    autoOpen?: boolean;
}

export default function UpiPaymentPanel({
    retailerUpiId,
    retailerName,
    orderNumber,
    netAmount,
    totalAmount,
    autoOpen = false,
}: UpiPaymentPanelProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const amount = getPayableAmount({ net_amount: netAmount, total_amount: totalAmount });
    const vpa = retailerUpiId?.trim() || '';
    const showAppButton = isUpiAppLaunchSupported();
    const showQr = isDesktopBrowser() && !!vpa && amount > 0;

    useEffect(() => {
        if (!vpa || amount <= 0) return;
        const uri = buildUpiPayUri({
            vpa,
            payeeName: retailerName,
            amount,
            transactionNote: `Order ${orderNumber}`,
        });
        if (showQr) {
            QRCode.toDataURL(uri, { width: 220, margin: 2 })
                .then(setQrDataUrl)
                .catch(() => setQrDataUrl(null));
        }
    }, [vpa, amount, retailerName, orderNumber, showQr]);

    useEffect(() => {
        if (!autoOpen || !vpa || amount <= 0 || !showAppButton) return;
        const timer = setTimeout(() => {
            openUpiPayment({
                vpa,
                payeeName: retailerName,
                amount,
                transactionNote: `Order ${orderNumber}`,
            });
        }, 400);
        return () => clearTimeout(timer);
    }, [autoOpen, vpa, amount, retailerName, orderNumber, showAppButton]);

    const handlePay = () => {
        if (!vpa) {
            toast.error('This shop has not added a UPI ID yet.');
            return;
        }
        const opened = openUpiPayment({
            vpa,
            payeeName: retailerName,
            amount,
            transactionNote: `Order ${orderNumber}`,
        });
        if (!opened) {
            toast.error('Open this page on your phone, or scan the QR below.');
        }
    };

    const copyUpiId = () => {
        if (!vpa) return;
        navigator.clipboard.writeText(vpa);
        toast.success('UPI ID copied!');
    };

    const copyAmount = () => {
        navigator.clipboard.writeText(amount.toFixed(2));
        toast.success('Amount copied!');
    };

    if (!vpa) {
        return (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                This shop has not added a UPI ID yet. Please contact the retailer or choose Cash on Delivery for future orders.
            </p>
        );
    }

    return (
        <div className={styles.qrContainer}>
            <div className="mb-3 text-center">
                <p className="text-sm text-gray-600">Pay exactly</p>
                <p className="text-2xl font-bold text-gray-900">₹{amount.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">to {retailerName}</p>
            </div>

            {showQr && qrDataUrl && (
                <div className={styles.qrWrapper}>
                    <img src={qrDataUrl} alt="UPI payment QR code" className={styles.qrImage} />
                    <p className="text-xs text-gray-500 text-center mt-2 px-2">
                        Scan with PhonePe, Google Pay, or Paytm on your phone. Amount is pre-filled.
                    </p>
                </div>
            )}

            <div className={styles.upiIdContainer}>
                <span className={styles.upiIdLabel}>UPI ID</span>
                <div className={styles.upiIdValue}>{vpa}</div>
                <div className="flex flex-wrap gap-2 justify-center">
                    <button type="button" onClick={copyUpiId} className={styles.copyButton}>
                        Copy UPI ID
                    </button>
                    {showQr && (
                        <button type="button" onClick={copyAmount} className={styles.copyButton}>
                            Copy amount
                        </button>
                    )}
                </div>
            </div>

            {showAppButton && (
                <Button fullWidth onClick={handlePay} className="mt-3">
                    Pay with UPI app
                </Button>
            )}
        </div>
    );
}
