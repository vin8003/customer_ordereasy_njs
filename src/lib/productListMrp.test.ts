/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleProductListMrp } from './productListMrp.ts';

describe('visibleProductListMrp — product list row MRP (OE-353)', () => {
    it('returns a trimmed top-level mrp when it is present and numeric non-zero', () => {
        assert.equal(visibleProductListMrp({ mrp: '  149.00  ' }), '149.00');
        assert.equal(visibleProductListMrp({ mrp: '80' }), '80');
        assert.equal(visibleProductListMrp({ mrp: 99.5 }), '99.5');
        assert.equal(visibleProductListMrp({ mrp: 12 }), '12');
    });

    it('hides missing, null, blank, non-numeric, and zero mrp', () => {
        for (const product of [
            undefined,
            null,
            {},
            { mrp: null },
            { mrp: undefined },
            { mrp: '' },
            { mrp: '   ' },
            { mrp: '0' },
            { mrp: '0.00' },
            { mrp: 0 },
            { mrp: 'abc' },
            { mrp: '₹80' },
            { mrp: NaN },
            { mrp: Infinity },
            { mrp: -Infinity },
            { mrp: true as unknown as string },
            { mrp: { amount: 80 } as unknown as number },
        ]) {
            assert.equal(visibleProductListMrp(product), null, String(product));
        }
    });

    it('does not invent mrp from original_price, price, or unit (OE-338)', () => {
        assert.equal(
            visibleProductListMrp({
                original_price: '199',
                price: '149',
                unit: 'kg',
            }),
            null
        );
        assert.equal(
            visibleProductListMrp({
                mrp: null,
                original_price: 199,
                price: 149,
                unit: '1 L',
            }),
            null
        );
        assert.equal(
            visibleProductListMrp({
                mrp: '   ',
                original_price: '199.00',
                unit: 'Unit',
            }),
            null
        );
        assert.equal(
            visibleProductListMrp({
                mrp: '175',
                original_price: '999',
                price: '100',
                unit: 'box',
            }),
            '175'
        );
    });
});
