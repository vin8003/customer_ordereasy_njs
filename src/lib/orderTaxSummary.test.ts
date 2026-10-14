import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getOrderTaxSummary } from './orderTaxSummary.ts';


describe('getOrderTaxSummary', () => {
    it('returns taxable and GST values when tax is positive', () => {
        assert.deepEqual(
            getOrderTaxSummary({ taxable_amount: '90.00', tax_amount: '16.20' }),
            { taxableAmount: '90.00', taxAmount: '16.20' },
        );
    });

    it('hides the tax rows when tax is zero or absent', () => {
        assert.equal(
            getOrderTaxSummary({ taxable_amount: '100.00', tax_amount: '0.00' }),
            null,
        );
        assert.equal(getOrderTaxSummary({}), null);
    });
});
