/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleOrderLineSubstitutedFor } from './orderLineSubstitutedFor.ts';

describe('visibleOrderLineSubstitutedFor', () => {
    it('returns the trimmed top-level label when substituted_for is present', () => {
        assert.equal(
            visibleOrderLineSubstitutedFor({ substituted_for: 'Amul Taaza 1L' }),
            'Amul Taaza 1L'
        );
        assert.equal(
            visibleOrderLineSubstitutedFor({ substituted_for: '  Mother Dairy Toned  ' }),
            'Mother Dairy Toned'
        );
        assert.equal(visibleOrderLineSubstitutedFor({ substituted_for: 12 }), '12');
    });

    it('hides missing, null, blank, and non-scalar junk', () => {
        for (const item of [
            {},
            { substituted_for: undefined },
            { substituted_for: null },
            { substituted_for: '' },
            { substituted_for: '   ' },
            { substituted_for: NaN },
            { substituted_for: Infinity },
            { substituted_for: -Infinity },
            { substituted_for: true },
            { substituted_for: false },
            { substituted_for: {} },
            { substituted_for: [] },
            { substituted_for: { product_name: 'Amul Taaza 1L' } },
        ]) {
            assert.equal(visibleOrderLineSubstitutedFor(item), null, JSON.stringify(item));
        }
    });

    it('returns null for a missing or null item', () => {
        assert.equal(visibleOrderLineSubstitutedFor(null), null);
        assert.equal(visibleOrderLineSubstitutedFor(undefined), null);
    });

    it('does not invent substituted_for from camelCase or sibling fields', () => {
        assert.equal(
            visibleOrderLineSubstitutedFor({
                substitutedFor: 'Amul Taaza 1L',
                original_product: 'Amul Taaza 1L',
                original_name: 'Amul Taaza 1L',
                replaced_item: 'Amul Taaza 1L',
                substitution: { name: 'Amul Taaza 1L' },
            }),
            null
        );
        assert.equal(
            visibleOrderLineSubstitutedFor({
                substituted_for: null,
                substitutedFor: 'Amul Taaza 1L',
                original_product: 'Amul Taaza 1L',
            }),
            null
        );
        assert.equal(
            visibleOrderLineSubstitutedFor({
                substituted_for: '   ',
                original_name: 'Amul Taaza 1L',
            }),
            null
        );
    });
});
