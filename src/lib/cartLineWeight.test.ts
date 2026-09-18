/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleCartLineWeight } from './cartLineWeight.ts';

describe('visibleCartLineWeight — cart line weight', () => {
    it('returns a trimmed top-level weight when it is a non-empty string', () => {
        assert.equal(visibleCartLineWeight({ weight: '  500g  ' }), '500g');
        assert.equal(visibleCartLineWeight({ weight: '1 kg' }), '1 kg');
    });

    it('returns a finite number as a string, including 0', () => {
        assert.equal(visibleCartLineWeight({ weight: 0.5 }), '0.5');
        assert.equal(visibleCartLineWeight({ weight: 12 }), '12');
        assert.equal(visibleCartLineWeight({ weight: 0 }), '0');
    });

    it('renders nothing for null, blank, or absent weight', () => {
        assert.equal(visibleCartLineWeight({ weight: null }), null);
        assert.equal(visibleCartLineWeight({ weight: '' }), null);
        assert.equal(visibleCartLineWeight({ weight: '   ' }), null);
        assert.equal(visibleCartLineWeight({}), null);
        assert.equal(visibleCartLineWeight(undefined), null);
        assert.equal(visibleCartLineWeight(null), null);
    });

    it('does not invent weight from nested objects, pack_size, unit, or brand', () => {
        assert.equal(
            visibleCartLineWeight({
                weight: { value: 1, unit: 'kg' },
            } as unknown as { weight?: string | number | null }),
            null
        );
        assert.equal(
            visibleCartLineWeight({
                pack_size: '1kg',
                unit: 'kg',
                brand_name: 'Amul',
            } as { weight?: string | number | null }),
            null
        );
        assert.equal(
            visibleCartLineWeight({
                weight: '   ',
                pack_size: '500g',
                unit: 'g',
            } as { weight?: string | number | null }),
            null
        );
        assert.equal(
            visibleCartLineWeight({
                weight: '250g',
                pack_size: 'other',
                brand_name: 'Amul',
            } as { weight?: string | number | null }),
            '250g'
        );
    });

    it('does not invent a weight from non-finite numbers or other types', () => {
        assert.equal(visibleCartLineWeight({ weight: Number.NaN }), null);
        assert.equal(visibleCartLineWeight({ weight: Number.POSITIVE_INFINITY }), null);
        assert.equal(visibleCartLineWeight({ weight: Number.NEGATIVE_INFINITY }), null);
        assert.equal(
            visibleCartLineWeight({ weight: true as unknown as string }),
            null
        );
        assert.equal(
            visibleCartLineWeight({ weight: ['1kg'] as unknown as string }),
            null
        );
    });
});
