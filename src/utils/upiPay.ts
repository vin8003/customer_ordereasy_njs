import { Capacitor } from '@capacitor/core';

export interface UpiPayParams {
    vpa: string;
    payeeName: string;
    amount: number;
    transactionNote?: string;
}

/** NPCI-style UPI deep link with amount pre-filled. */
export function buildUpiPayUri({ vpa, payeeName, amount, transactionNote }: UpiPayParams): string {
    const params = new URLSearchParams({
        pa: vpa.trim(),
        pn: payeeName.trim().slice(0, 50),
        am: amount.toFixed(2),
        cu: 'INR',
    });
    if (transactionNote) {
        params.set('tn', transactionNote.trim().slice(0, 80));
    }
    return `upi://pay?${params.toString()}`;
}

/** Android WebView: intent URL so the system UPI app chooser opens. */
export function buildAndroidIntentUri(upiUri: string): string {
    const pathAndQuery = upiUri.replace(/^upi:\/\//, '');
    return `intent://${pathAndQuery}#Intent;scheme=upi;action=android.intent.action.VIEW;end`;
}

export function isUpiAppLaunchSupported(): boolean {
    if (typeof window === 'undefined') return false;
    if (Capacitor.isNativePlatform()) return true;
    return /Android/i.test(navigator.userAgent);
}

export function isDesktopBrowser(): boolean {
    if (typeof window === 'undefined') return false;
    if (Capacitor.isNativePlatform()) return false;
    return !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Opens UPI app chooser on Android native / Android Chrome. Returns false on desktop. */
export function openUpiPayment(params: UpiPayParams): boolean {
    if (!params.vpa?.trim() || params.amount <= 0) return false;

    const upiUri = buildUpiPayUri(params);

    if (Capacitor.isNativePlatform()) {
        window.location.href = buildAndroidIntentUri(upiUri);
        return true;
    }

    if (/Android/i.test(navigator.userAgent)) {
        window.location.href = upiUri;
        return true;
    }

    return false;
}

export function getPayableAmount(order: {
    net_amount?: string;
    total_amount: string;
}): number {
    const net = order.net_amount ? parseFloat(order.net_amount) : NaN;
    if (Number.isFinite(net) && net > 0) return net;
    const total = parseFloat(order.total_amount);
    return Number.isFinite(total) ? total : 0;
}
