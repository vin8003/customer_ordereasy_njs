import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    buildAndroidIntentUri,
    buildUpiPayUri,
    resolveAndroidUpiLaunchUrl,
} from './upiPay.ts';

const sampleUpiUri = 'upi://pay?pa=shop%40okhdfcbank&pn=Sharma%20Kirana&am=250.50&cu=INR';

describe('buildAndroidIntentUri', () => {
    it('wraps upi:// for mobile Chrome', () => {
        const intent = buildAndroidIntentUri(sampleUpiUri);
        assert.match(intent, /^intent:\/\/pay\?/);
        assert.match(intent, /scheme=upi/);
        assert.match(intent, /action=android\.intent\.action\.VIEW/);
    });
});

describe('buildUpiPayUri', () => {
    it('builds a standard upi://pay link', () => {
        const uri = buildUpiPayUri({
            vpa: 'merchant@upi',
            payeeName: 'Test Shop',
            amount: 99.5,
            transactionNote: 'Order 1',
        });
        assert.match(uri, /^upi:\/\/pay\?/);
        assert.match(uri, /pa=merchant%40upi/);
        assert.match(uri, /am=99\.50/);
    });
});

describe('resolveAndroidUpiLaunchUrl', () => {
    it('uses direct upi:// in native Capacitor Android', () => {
        assert.equal(resolveAndroidUpiLaunchUrl(sampleUpiUri, true), sampleUpiUri);
    });

    it('uses intent:// wrapper in Android mobile browser', () => {
        const launchUrl = resolveAndroidUpiLaunchUrl(sampleUpiUri, false);
        assert.notEqual(launchUrl, sampleUpiUri);
        assert.equal(launchUrl, buildAndroidIntentUri(sampleUpiUri));
    });

    it('rejects non-upi URIs', () => {
        assert.equal(resolveAndroidUpiLaunchUrl('https://example.com', true), null);
        assert.equal(resolveAndroidUpiLaunchUrl('https://example.com', false), null);
    });
});
