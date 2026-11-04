/**
 * Negative and edge inputs for checkout, payment, delivery and report helpers.
 * Run with: npm test (node --test, TypeScript stripped at runtime).
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { flatDeliveryFee, formatDistanceKm, parseDeliveryQuote } from './deliveryQuote.ts';
import { isOrderOpenForFulfillment, telHref } from './fulfillmentVisibility.ts';
import { reportErrorMessage, validateReport, REPORT_TEXT_MAX } from './reportForm.ts';
import { buildTxnRef, buildUpiIntentUri, formatUpiAmount } from './upiIntent.ts';

describe('formatUpiAmount refuses amounts it cannot encode exactly', () => {
    for (const bad of [null, undefined, '', '  ', '0', '0.00', '-5', 'abc', '1e3', '10.999', '1,000', NaN, Infinity, -1]) {
        it(`refuses ${JSON.stringify(bad) ?? String(bad)}`, () => {
            assert.equal(formatUpiAmount(bad as string | number | null | undefined), null);
        });
    }
    it('pads a whole amount and trims spaces', () => {
        assert.equal(formatUpiAmount(' 250 '), '250.00');
        assert.equal(formatUpiAmount('0.5'), '0.50');
    });
});

describe('buildUpiIntentUri returns null rather than a QR that would not pay', () => {
    const ok = { upiId: 'shop@upi', shopName: 'Shop', amount: '100', orderNumber: 'ORD1', txnRef: 'TR1' };
    for (const field of ['upiId', 'orderNumber', 'amount', 'txnRef'] as const) {
        it(`null when ${field} is blank`, () => {
            assert.equal(buildUpiIntentUri({ ...ok, [field]: '   ' }), null);
        });
    }
    it('null when the amount is zero', () => {
        assert.equal(buildUpiIntentUri({ ...ok, amount: 0 }), null);
    });
    it('encodes characters that would break the query string', () => {
        const uri = buildUpiIntentUri({ ...ok, shopName: 'A&B=C', upiId: 'x&am=1@upi' })!;
        assert.match(uri, /pn=A%26B%3DC/);
        assert.equal(uri.match(/&am=/g)?.length, 1);
    });
    it('txn ref keeps only letters and digits and stays within 35 chars', () => {
        const ref = buildTxnRef('ord-#1/'.repeat(10), 0);
        assert.match(ref, /^[A-Z0-9]+$/);
        assert.ok(ref.length <= 35);
    });
});

describe('parseDeliveryQuote rejects malformed responses', () => {
    for (const raw of [null, undefined, 'x', 42, {}, { deliverable: 'yes', delivery_fee: 10 }, { deliverable: true }, { deliverable: true, delivery_fee: 'abc' }, { deliverable: true, delivery_fee: '' }]) {
        it(`null for ${JSON.stringify(raw)}`, () => {
            assert.equal(parseDeliveryQuote(raw), null);
        });
    }
    it('keeps a not-deliverable quote and drops a bad distance', () => {
        assert.deepEqual(parseDeliveryQuote({ deliverable: false, delivery_fee: '0', distance_km: 'far', reason: 'Outside radius' }), {
            deliverable: false, fee: 0, distanceKm: null, reason: 'Outside radius', pricing: '',
        });
    });
    it('flat fee: no free delivery when the threshold is 0, free exactly at the threshold', () => {
        assert.equal(flatDeliveryFee({ deliveryCharge: 30, freeDeliveryThreshold: 0 }, 10_000), 30);
        assert.equal(flatDeliveryFee({ deliveryCharge: 30, freeDeliveryThreshold: 500 }, 499.99), 30);
        assert.equal(flatDeliveryFee({ deliveryCharge: 30, freeDeliveryThreshold: 500 }, 500), 0);
    });
    it('distance label is empty for unknown or non-finite values', () => {
        for (const km of [null, undefined, NaN, Infinity]) assert.equal(formatDistanceKm(km as number | null), '');
    });
});

describe('fulfillment contact is hidden for closed orders and unsafe phones', () => {
    for (const s of ['delivered', 'CANCELLED', 'Returned']) {
        it(`closed: ${s}`, () => assert.equal(isOrderOpenForFulfillment(s), false));
    }
    it('unknown or missing status counts as open', () => {
        assert.equal(isOrderOpenForFulfillment(undefined), true);
        assert.equal(isOrderOpenForFulfillment('pending'), true);
    });
    for (const p of [null, undefined, '', 'abc', '12345', '+91-12']) {
        it(`no tel link for ${JSON.stringify(p)}`, () => assert.equal(telHref(p), null));
    }
    it('tel link drops injected parameters and extra plus signs', () => {
        assert.equal(telHref('+91 98765?x=1+43210'), 'tel:+9198765143210');
    });
});

describe('report form validation and error messages', () => {
    it('needs a reason', () => assert.equal(validateReport('shop', '', ''), 'Choose a reason.'));
    it('refuses a reason not offered for the target', () => {
        assert.equal(validateReport('shop', 'wrong_price', ''), 'Choose a reason from the list.');
        assert.equal(validateReport('product', 'not_delivered', ''), 'Choose a reason from the list.');
        assert.equal(validateReport('product', 'hack', ''), 'Choose a reason from the list.');
    });
    it('refuses text over the limit, accepts exactly the limit', () => {
        assert.match(validateReport('shop', 'other', 'x'.repeat(REPORT_TEXT_MAX + 1))!, /under 1000/);
        assert.equal(validateReport('shop', 'other', 'x'.repeat(REPORT_TEXT_MAX)), null);
    });
    it('maps API failures to plain messages', () => {
        const e = (status: number, data?: object) => ({ response: { status, data } });
        assert.equal(reportErrorMessage(e(401)), 'Log in to send a report.');
        assert.equal(reportErrorMessage(e(403)), 'Log in to send a report.');
        assert.equal(reportErrorMessage(e(404)), 'This shop is not available any more.');
        assert.match(reportErrorMessage(e(429)), /many reports/);
        assert.equal(reportErrorMessage(e(400, { text: ['Too long'] })), 'Too long');
        assert.equal(reportErrorMessage(e(400, { error: 'Nope' })), 'Nope');
        assert.equal(reportErrorMessage(e(500)), 'Could not send the report. Please try again.');
        assert.equal(reportErrorMessage(new Error('network')), 'Could not send the report. Please try again.');
    });
});
