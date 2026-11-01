/** Run with: npm test. Regression: the Report entry points and API call stay wired. */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(path.resolve(process.cwd(), p), 'utf8');

describe('customer report wiring', () => {
    it('shop page reports the shop (no product id)', () => {
        assert.match(read('src/app/retailer/page.tsx'), /<ReportButton retailerId=\{retailerId\} \/>/);
    });

    it('product page reports the product', () => {
        assert.match(read('src/app/retailer/product/page.tsx'), /<ReportButton retailerId=\{retailerId\} productId=\{product\.id\} \/>/);
    });

    it('posts to the backend report route without the global error toast', () => {
        const api = read('src/services/api.ts');
        assert.match(api, /api\.post\(`retailer\/\$\{retailerId\}\/report\/`/);
        assert.match(api, /skipErrorToast: true/);
        assert.match(api, /!\(originalRequest as \{ skipErrorToast\?: boolean \} \| undefined\)\?\.skipErrorToast/);
    });

    it('sends logged-out customers to login and back', () => {
        const src = read('src/app/components/ReportButton.tsx');
        assert.match(src, /apiService\.isAuthenticated\(\)/);
        assert.match(src, /\/login\?redirect=/);
    });

    it('moves focus into the sheet, locks page scroll and restores both on close', () => {
        const src = read('src/app/components/ReportButton.tsx');
        assert.match(src, /sheet\.current\?\.focus\(\)/);
        assert.match(src, /document\.body\.style\.overflow = 'hidden'/);
        assert.match(src, /document\.body\.style\.overflow = previousOverflow/);
        assert.match(src, /trigger\?\.focus\(\)/);
    });
});
