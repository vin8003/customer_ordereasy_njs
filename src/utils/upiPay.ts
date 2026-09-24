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

function userAgent(): string {
    if (typeof navigator === 'undefined') return '';
    return navigator.userAgent || '';
}

export function isNativeAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    } catch {
        return false;
    }
}

/** Phone / tablet / Play Store WebView — not a laptop browser. */
export function isMobileUpiClient(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        if (Capacitor.isNativePlatform()) return true;
    } catch {
        /* ignore */
    }
    return /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(userAgent());
}

export function isUpiAppLaunchSupported(): boolean {
    return isMobileUpiClient();
}

export function isDesktopBrowser(): boolean {
    if (typeof window === 'undefined') return false;
    return !isMobileUpiClient();
}

function navigateToUpi(url: string) {
    window.location.assign(url);
}

/** Opens UPI app chooser on Android native / Android Chrome. Returns false on desktop. */
export function openUpiPayment(params: UpiPayParams): boolean {
    if (!params.vpa?.trim() || params.amount <= 0) return false;
    return openUpiUri(buildUpiPayUri(params));
}

/** Open a pre-built `upi://` URI via Android Intent chooser, or upi:// on iOS/Chrome. */
export function openUpiUri(upiUri: string): boolean {
    if (!upiUri || !upiUri.startsWith('upi://')) return false;
    if (typeof window === 'undefined') return false;

    const androidUa = /Android/i.test(userAgent());
    if (isNativeAndroid() || androidUa) {
        navigateToUpi(buildAndroidIntentUri(upiUri));
        return true;
    }

    if (isMobileUpiClient()) {
        navigateToUpi(upiUri);
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
