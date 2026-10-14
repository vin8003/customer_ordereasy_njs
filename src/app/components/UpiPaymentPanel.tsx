'use client';

import React, { useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from '@/lib/toast';
import { Button } from '@/app/components/ui/Button';
import { buildTxnRef, buildUpiIntentUri, formatUpiAmount } from '@/lib/upiIntent';
import { isDesktopBrowser, isUpiAppLaunchSupported, openUpiUri } from '@/utils/upiPay';
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
    const showGeneratedQr = isDesktopBrowser() && !!upiIntentUri;
    const showShopQr = isDesktopBrowser() && !upiIntentUri && !!retailerUpiQrCode;

    useEffect(() => {
        if (!upiIntentUri || !showAppButton) return;
        const timer = setTimeout(() => {
            openUpiUri(upiIntentUri);
        }, autoOpen ? 400 : 300);
        return () => clearTimeout(timer);
    }, [autoOpen, upiIntentUri, showAppButton]);

    const handlePay = () => {
        if (!upiIntentUri) {
            toast.error('UPI is not available for this order. Copy the UPI ID and pay in your app.');
            return;
        }
        const opened = openUpiUri(upiIntentUri);
        if (!opened) {
            toast.error('Could not open a UPI app. Install PhonePe, Google Pay, or Paytm and try again.');
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
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-4)]">Pay exactly</p>
                    <p className="mt-1 text-[2rem] font-extrabold leading-none tracking-tight text-[var(--ink)]">₹{amountLabel}</p>
                    <p className="mt-1.5 text-xs text-[var(--ink-3)]">to {retailerName}</p>
                </div>
            )}

            {showAppButton && (
                <Button fullWidth size="lg" onClick={handlePay}>
                    Pay with PhonePe, GPay or Paytm
                </Button>
            )}

            {showGeneratedQr ? (
                <>
                    <div className={styles.qrWrapper}>
                        <QRCodeSVG
                            value={upiIntentUri!}
                            size={140}
                            className={styles.qrImage}
                            title={`UPI payment QR for order ${orderNumber}`}
                        />
                    </div>
                    <p className="text-center text-[13px] text-[var(--ink-3)]">
                        Scan with any UPI app to pay <strong>₹{amountLabel}</strong> for this order.
                    </p>
                </>
            ) : showShopQr ? (
                <>
                    <div className={styles.qrWrapper}>
                        <img src={retailerUpiQrCode} alt="UPI QR Code" className={styles.qrImage} />
                    </div>
                    <p className="text-center text-[13px] text-[var(--ink-3)]">
                        Scan this shop QR and enter <strong>₹{amountLabel}</strong> manually.
                    </p>
                </>
            ) : !showAppButton && !vpa ? (
                <div className="text-center text-[13px] text-[var(--ink-3)]">
                    This shop has not added a UPI ID yet. Please contact the shop to complete payment.
                </div>
            ) : showAppButton ? (
                <p className="text-center text-xs text-[var(--ink-3)]">
                    If no app opens, tap the button above to choose PhonePe, Google Pay, or Paytm.
                </p>
            ) : (
                <div className="text-center text-[13px] text-[var(--ink-3)]">
                    Exact-amount QR unavailable for this order. Please pay using the UPI ID below.
                </div>
            )}

            <div className={styles.upiIdContainer}>
                <span className={styles.upiIdLabel}>UPI ID</span>
                <div className={styles.upiIdValue}>{vpa || 'Not Provided'}</div>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
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
        </div>
    );
}
