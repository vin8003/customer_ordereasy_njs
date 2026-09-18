/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    formatVisibleBackorderQty,
    parseOptionalBackorderQty,
} from './productDetailBackorderQty.ts';

describe('parseOptionalBackorderQty', () => {
    it('parses numeric strings and finite numbers', () => {
        assert.equal(parseOptionalBackorderQty('5'), 5);
        assert.equal(parseOptionalBackorderQty('12.5'), 12.5);
        assert.equal(parseOptionalBackorderQty(' 3 '), 3);
        assert.equal(parseOptionalBackorderQty(8), 8);
        assert.equal(parseOptionalBackorderQty(0), 0);
        assert.equal(parseOptionalBackorderQty('0.00'), 0);
    });

    it('returns null for missing, blank, or non-numeric values', () => {
        for (const value of [
            undefined,
            null,
            '',
            '   ',
            'abc',
            'qty:2',
            NaN,
            Infinity,
            -Infinity,
            true,
            false,
            {},
            [],
        ]) {
            assert.equal(parseOptionalBackorderQty(value), null, String(value));
        }
    });
});

describe('formatVisibleBackorderQty', () => {
    it('returns the trimmed top-level qty when it is present and non-zero', () => {
        assert.equal(formatVisibleBackorderQty({ backorder_qty: '5' }), '5');
        assert.equal(formatVisibleBackorderQty({ backorder_qty: ' 12 ' }), '12');
        assert.equal(formatVisibleBackorderQty({ backorder_qty: 8 }), '8');
    });

    it('hides missing, null, blank, zero, and non-numeric values', () => {
        for (const product of [
            {},
            { backorder_qty: undefined },
            { backorder_qty: null },
            { backorder_qty: '' },
            { backorder_qty: '   ' },
            { backorder_qty: '0' },
            { backorder_qty: '0.00' },
            { backorder_qty: 0 },
            { backorder_qty: 'abc' },
            { backorder_qty: 'qty:2' },
        ]) {
            assert.equal(formatVisibleBackorderQty(product), null, JSON.stringify(product));
        }
        assert.equal(formatVisibleBackorderQty(null), null);
        assert.equal(formatVisibleBackorderQty(undefined), null);
    });

    it('does not invent backorder_qty from stock, quantity, MOQ, or nested objects', () => {
        assert.equal(
            formatVisibleBackorderQty({
                stock_quantity: 4,
                quantity: 4,
                minimum_order_quantity: 2,
            }),
            null
        );
        assert.equal(
            formatVisibleBackorderQty({
                backorder_qty: null,
                stock_quantity: 4,
                quantity: 4,
            }),
            null
        );
        assert.equal(
            formatVisibleBackorderQty({
                backorder_qty: '0',
                stock_quantity: 4,
                quantity: 4,
            }),
            null
        );
        assert.equal(
            formatVisibleBackorderQty({
                backorder_qty: { qty: 5 },
            } as { backorder_qty: unknown }),
            null
        );
    });
});
