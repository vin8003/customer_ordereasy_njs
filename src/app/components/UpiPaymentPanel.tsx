'use client';

import React, { useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from '@/lib/toast';
import { Button } from '@/app/components/ui/Button';
import { buildTxnRef, buildUpiIntentUri, formatUpiAmount } from '@/lib/upiIntent';
import { isUpiAppLaunchSupported, openUpiUri } from '@/utils/upiPay';
import styles from '../orders/detail/OrderDetails.module.css';

interface UpiPaymentPanelProps {
    retailerUpiId?: string;
    retailerName: string;
    orderNumber: string;
    netAmount?: string;
    totalAmount: string;
    retailerUpiQrCode?: string;
    autoOpen?: boolean;
}

export default function UpiPaymentPanel({
    retailerUpiId,
    retailerName,
    orderNumber,
    netAmount,
    totalAmount,
    retailerUpiQrCode,
    autoOpen = false,
}: UpiPaymentPanelProps) {
    const amountSource = netAmount || totalAmount;
    const amountLabel = formatUpiAmount(amountSource);
    const txnRef = useMemo(() => buildTxnRef(orderNumber), [orderNumber]);
    const upiIntentUri = useMemo(
        () =>
            buildUpiIntentUri({
                upiId: retailerUpiId,
                shopName: retailerName,
                amount: amountSource,
                orderNumber,
                txnRef,
            }),
        [retailerUpiId, retailerName, amountSource, orderNumber, txnRef]
    );
    const vpa = retailerUpiId?.trim() || '';
    const showAppButton = isUpiAppLaunchSupported() && !!upiIntentUri;

    useEffect(() => {
        if (!autoOpen || !upiIntentUri || !showAppButton) return;
        const timer = setTimeout(() => {
            openUpiUri(upiIntentUri);
        }, 400);
        return () => clearTimeout(timer);
    }, [autoOpen, upiIntentUri, showAppButton]);

    const handlePay = () => {
        if (!upiIntentUri) {
            toast.error('Open this page on your phone, or scan the QR below.');
            return;
        }
        const opened = openUpiUri(upiIntentUri);
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
        if (!amountLabel) return;
        navigator.clipboard.writeText(amountLabel);
        toast.success('Amount copied!');
    };

    return (
        <div className={styles.qrContainer}>
            {amountLabel && (
                <div className="mb-3 text-center">
                    <p className="text-sm text-gray-600">Pay exactly</p>
                    <p className="text-2xl font-bold text-gray-900">₹{amountLabel}</p>
                    <p className="text-xs text-gray-500 mt-1">to {retailerName}</p>
                </div>
            )}

            {upiIntentUri ? (
                <>
                    <div className={styles.qrWrapper}>
                        <QRCodeSVG
                            value={upiIntentUri}
                            size={140}
                            className={styles.qrImage}
                            title={`UPI payment QR for order ${orderNumber}`}
                        />
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                        Scan with any UPI app to pay <strong>₹{amountLabel}</strong> for this order.
                    </p>
                </>
            ) : retailerUpiQrCode ? (
                <>
                    <div className={styles.qrWrapper}>
                        <img src={retailerUpiQrCode} alt="UPI QR Code" className={styles.qrImage} />
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                        Scan this shop QR and enter <strong>₹{amountLabel}</strong> manually.
                    </p>
                </>
            ) : (
                <div className="text-sm text-gray-500 italic text-center">
                    {vpa
                        ? 'Exact-amount QR unavailable for this order. Please pay using the UPI ID below.'
                        : 'This shop has not added a UPI ID yet. Please contact the shop to complete payment.'}
                </div>
            )}

            <div className={styles.upiIdContainer}>
                <span className={styles.upiIdLabel}>UPI ID</span>
                <div className={styles.upiIdValue}>{vpa || 'Not Provided'}</div>
                <div className="flex flex-wrap gap-2 justify-center">
                    {vpa && (
                        <button type="button" onClick={copyUpiId} className={styles.copyButton}>
                            Copy UPI ID
                        </button>
                    )}
                    {amountLabel && (
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
