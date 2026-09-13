/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildTxnRef, buildUpiIntentUri, formatUpiAmount } from './upiIntent.ts';

const baseInput = {
    upiId: 'shop@okhdfcbank',
    shopName: 'Sharma Kirana',
    amount: '250.5',
    orderNumber: 'ORD-1042',
    txnRef: 'OEORD1042ABC',
};

describe('formatUpiAmount', () => {
    it('pads to exactly two decimals', () => {
        assert.equal(formatUpiAmount('250'), '250.00');
        assert.equal(formatUpiAmount('250.5'), '250.50');
        assert.equal(formatUpiAmount(1234.5), '1234.50');
        assert.equal(formatUpiAmount('0.99'), '0.99');
    });

    it('rejects amounts with more than two decimals', () => {
        assert.equal(formatUpiAmount('250.555'), null);
        assert.equal(formatUpiAmount(99.999), null);
    });

    it('rejects missing, non-numeric and non-positive amounts', () => {
        assert.equal(formatUpiAmount(null), null);
        assert.equal(formatUpiAmount(undefined), null);
        assert.equal(formatUpiAmount(''), null);
        assert.equal(formatUpiAmount('abc'), null);
        assert.equal(formatUpiAmount('-10.00'), null);
        assert.equal(formatUpiAmount('0'), null);
    });
});

describe('buildTxnRef', () => {
    it('is uppercase alphanumeric and within the NPCI 35 char limit', () => {
        const ref = buildTxnRef('ORD-1042');
        assert.match(ref, /^OE[A-Z0-9]+$/);
        assert.ok(ref.length <= 35, `unexpected length ${ref.length}`);
        assert.ok(ref.startsWith('OEORD1042'), ref);
    });

    it('is unique across renders of the same order', () => {
        const refs = new Set(Array.from({ length: 50 }, () => buildTxnRef('ORD-1042')));
        assert.equal(refs.size, 50);
    });
});

describe('buildUpiIntentUri', () => {
    it('emits the NPCI params in the agreed order', () => {
        assert.equal(
            buildUpiIntentUri(baseInput),
            'upi://pay?pa=shop%40okhdfcbank&pn=Sharma%20Kirana&am=250.50&cu=INR&tn=OE-ORD-1042&tr=OEORD1042ABC'
        );
    });

    it('encodes the order number into tn and keeps the amount at two decimals', () => {
        const uri = buildUpiIntentUri({ ...baseInput, amount: 1200, orderNumber: 'OE 77/A' });
        assert.ok(uri);
        assert.ok(uri.includes('&tn=OE-OE%2077%2FA&'), uri);
        assert.ok(uri.includes('&am=1200.00&'), uri);
    });

    it('falls back to a generic payee name when the shop name is blank', () => {
        const uri = buildUpiIntentUri({ ...baseInput, shopName: '  ' });
        assert.ok(uri?.includes('&pn=OrderEasy%20Merchant&'), String(uri));
    });

    it('returns null when a required field is missing or the amount is unusable', () => {
        assert.equal(buildUpiIntentUri({ ...baseInput, upiId: '' }), null);
        assert.equal(buildUpiIntentUri({ ...baseInput, upiId: null }), null);
        assert.equal(buildUpiIntentUri({ ...baseInput, orderNumber: '' }), null);
        assert.equal(buildUpiIntentUri({ ...baseInput, txnRef: '' }), null);
        assert.equal(buildUpiIntentUri({ ...baseInput, amount: '250.555' }), null);
        assert.equal(buildUpiIntentUri({ ...baseInput, amount: null }), null);
    });
});
