export interface OrderTaxValues {
    taxable_amount?: string | number | null;
    tax_amount?: string | number | null;
}

export interface OrderTaxSummary {
    taxableAmount: string;
    taxAmount: string;
}

export function getOrderTaxSummary(
    values: OrderTaxValues,
): OrderTaxSummary | null {
    const taxAmount = Number(values.tax_amount);
    if (!Number.isFinite(taxAmount) || taxAmount <= 0) {
        return null;
    }

    return {
        taxableAmount: Number(values.taxable_amount || 0).toFixed(2),
        taxAmount: taxAmount.toFixed(2),
    };
}
