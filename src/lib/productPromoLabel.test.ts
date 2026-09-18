/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleProductPromoLabel } from './productPromoLabel.ts';

describe('visibleProductPromoLabel — product-list promo badge', () => {
    it('returns a trimmed top-level promo_label when it is non-empty', () => {
        assert.equal(visibleProductPromoLabel({ promo_label: '  Festival Deal  ' }), 'Festival Deal');
        assert.equal(visibleProductPromoLabel({ promo_label: 'BOGO' }), 'BOGO');
    });

    it('renders nothing for null, blank, or absent promo_label', () => {
        assert.equal(visibleProductPromoLabel({ promo_label: null }), null);
        assert.equal(visibleProductPromoLabel({ promo_label: '' }), null);
        assert.equal(visibleProductPromoLabel({ promo_label: '   ' }), null);
        assert.equal(visibleProductPromoLabel({}), null);
        assert.equal(visibleProductPromoLabel(undefined), null);
        assert.equal(visibleProductPromoLabel(null), null);
    });

    it('does not invent a label from offer text or nested promo objects', () => {
        assert.equal(
            visibleProductPromoLabel({
                active_offer_text: '10% off',
            } as { promo_label?: string | null }),
            null
        );
        assert.equal(
            visibleProductPromoLabel({
                promo: { label: 'Hidden Promo' },
            } as { promo_label?: string | null }),
            null
        );
        assert.equal(
            visibleProductPromoLabel({
                promo_label: '   ',
                promo: { label: 'Hidden Promo' },
                active_offer_text: '10% off',
            } as { promo_label?: string | null }),
            null
        );
        assert.equal(
            visibleProductPromoLabel({
                promo_label: 'Visible',
                promo: { label: 'Other' },
                active_offer_text: '10% off',
            } as { promo_label?: string | null }),
            'Visible'
        );
    });
});
