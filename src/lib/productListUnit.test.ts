/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleProductListUnit } from './productListUnit.ts';

describe('visibleProductListUnit — product list row unit (OE-338)', () => {
    it('returns a trimmed top-level unit when it is non-empty', () => {
        assert.equal(visibleProductListUnit({ unit: '  kg  ' }), 'kg');
        assert.equal(visibleProductListUnit({ unit: 'pcs' }), 'pcs');
    });

    it('hides null, blank, or absent unit', () => {
        assert.equal(visibleProductListUnit({ unit: null }), null);
        assert.equal(visibleProductListUnit({ unit: '' }), null);
        assert.equal(visibleProductListUnit({ unit: '   ' }), null);
        assert.equal(visibleProductListUnit({}), null);
        assert.equal(visibleProductListUnit(undefined), null);
        assert.equal(visibleProductListUnit(null), null);
    });

    it('does not invent a unit from nested fields, placeholders, or non-strings', () => {
        assert.equal(
            visibleProductListUnit({
                uom: 'kg',
            } as { unit?: string | null }),
            null
        );
        assert.equal(
            visibleProductListUnit({
                unit: '   ',
                uom: 'kg',
            } as { unit?: string | null }),
            null
        );
        assert.equal(
            visibleProductListUnit({
                unit: 'litre',
                uom: 'other',
            } as { unit?: string | null }),
            'litre'
        );
        assert.equal(
            visibleProductListUnit({ unit: 12 as unknown as string }),
            null
        );
    });
});
