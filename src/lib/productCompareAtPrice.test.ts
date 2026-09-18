/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleProductCompareAtPrice } from './productCompareAtPrice.ts';

describe('visibleProductCompareAtPrice — product-list compare-at line', () => {
    it('returns the trimmed top-level amount when it is present and non-zero', () => {
        assert.equal(visibleProductCompareAtPrice({ compare_at_price: '199.00' }), '199.00');
        assert.equal(visibleProductCompareAtPrice({ compare_at_price: ' 150 ' }), '150');
        assert.equal(visibleProductCompareAtPrice({ compare_at_price: 99 }), '99');
        assert.equal(visibleProductCompareAtPrice({ compare_at_price: 12.5 }), '12.5');
    });

    it('hides missing, null, blank, zero, and non-numeric values', () => {
        for (const product of [
            undefined,
            null,
            {},
            { compare_at_price: null },
            { compare_at_price: undefined },
            { compare_at_price: '' },
            { compare_at_price: '   ' },
            { compare_at_price: 0 },
            { compare_at_price: '0' },
            { compare_at_price: '0.00' },
            { compare_at_price: 'abc' },
            { compare_at_price: '₹99' },
        ]) {
            assert.equal(
                visibleProductCompareAtPrice(product),
                null,
                JSON.stringify(product)
            );
        }
    });

    it('does not invent a compare-at price from mrp, original_price, or nested objects', () => {
        assert.equal(
            visibleProductCompareAtPrice({
                mrp: 199,
                original_price: 199,
            } as { compare_at_price?: string | number | null }),
            null
        );
        assert.equal(
            visibleProductCompareAtPrice({
                compare_at_price: null,
                mrp: 250,
                original_price: '250.00',
            } as { compare_at_price?: string | number | null }),
            null
        );
        assert.equal(
            visibleProductCompareAtPrice({
                pricing: { compare_at_price: '180' },
            } as { compare_at_price?: string | number | null }),
            null
        );
        assert.equal(
            visibleProductCompareAtPrice({
                compare_at_price: ' 175.00 ',
                mrp: 999,
                original_price: 999,
            } as { compare_at_price?: string | number | null }),
            '175.00'
        );
    });
});
