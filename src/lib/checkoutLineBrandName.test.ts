/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    isLocalDummyCheckoutPreview,
    localDummyCheckoutLines,
    visibleCheckoutLineBrandName,
} from './checkoutLineBrandName.ts';

describe('visibleCheckoutLineBrandName — checkout line brand', () => {
    it('returns a trimmed top-level brand_name when it is non-empty', () => {
        assert.equal(visibleCheckoutLineBrandName({ brand_name: '  Amul  ' }), 'Amul');
        assert.equal(visibleCheckoutLineBrandName({ brand_name: 'Nestlé' }), 'Nestlé');
    });

    it('renders nothing for null, blank, or absent brand_name', () => {
        assert.equal(visibleCheckoutLineBrandName({ brand_name: null }), null);
        assert.equal(visibleCheckoutLineBrandName({ brand_name: '' }), null);
        assert.equal(visibleCheckoutLineBrandName({ brand_name: '   ' }), null);
        assert.equal(visibleCheckoutLineBrandName({}), null);
        assert.equal(visibleCheckoutLineBrandName(undefined), null);
        assert.equal(visibleCheckoutLineBrandName(null), null);
    });

    it('does not invent a brand from nested brand objects or non-strings', () => {
        assert.equal(
            visibleCheckoutLineBrandName({
                brand: { name: 'Hidden Brand' },
            } as { brand_name?: string | null }),
            null
        );
        assert.equal(
            visibleCheckoutLineBrandName({
                brand_name: '   ',
                brand: { name: 'Hidden Brand' },
            } as { brand_name?: string | null }),
            null
        );
        assert.equal(
            visibleCheckoutLineBrandName({
                brand_name: 'Visible',
                brand: { name: 'Other' },
            } as { brand_name?: string | null }),
            'Visible'
        );
        assert.equal(
            visibleCheckoutLineBrandName({ brand_name: 12 as unknown as string }),
            null
        );
    });
});

describe('isLocalDummyCheckoutPreview — never live hosts', () => {
    it('allows only 127.0.0.1 / localhost with dummyBrand=1', () => {
        assert.equal(isLocalDummyCheckoutPreview('127.0.0.1', '?dummyBrand=1'), true);
        assert.equal(isLocalDummyCheckoutPreview('localhost', 'dummyBrand=1'), true);
    });

    it('stays off without the query flag, even on loopback', () => {
        assert.equal(isLocalDummyCheckoutPreview('127.0.0.1', ''), false);
        assert.equal(isLocalDummyCheckoutPreview('localhost', '?dummyBrand=0'), false);
        assert.equal(isLocalDummyCheckoutPreview('127.0.0.1', '?other=1'), false);
    });

    it('never activates on *.ordereasy.win or other remotes', () => {
        for (const host of [
            'customer.ordereasy.win',
            'api.ordereasy.win',
            'www.ordereasy.win',
            'ordereasy.win',
            'example.com',
        ]) {
            assert.equal(isLocalDummyCheckoutPreview(host, '?dummyBrand=1'), false, host);
        }
    });
});

describe('localDummyCheckoutLines', () => {
    it('includes a present brand, a null brand, and a blank brand', () => {
        const lines = localDummyCheckoutLines();
        assert.equal(visibleCheckoutLineBrandName(lines[0]), 'Amul');
        assert.equal(visibleCheckoutLineBrandName(lines[1]), null);
        assert.equal(visibleCheckoutLineBrandName(lines[2]), null);
    });
});
