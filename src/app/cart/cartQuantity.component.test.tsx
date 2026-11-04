import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// API layer and cart context are mocked: nothing here talks to a real host.
const toastError = vi.fn();
const updateContextQuantity = vi.fn(async () => {});
const contextItems: unknown[] = [];
const stableWishlist = { loadWishlist: () => {}, toggleWishlist: () => {}, isWishlisted: () => false };
let line: Record<string, unknown>;

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/useAppNavigation", () => ({ useAppNavigation: () => ({ handleBack: vi.fn() }) }));
vi.mock("@/lib/toast", () => ({ default: { error: (m: string) => toastError(m), success: vi.fn() } }));
vi.mock("@/hooks/useWishlist", () => ({ useWishlist: () => stableWishlist }));
vi.mock("@/app/components/PageHeader", () => ({ default: () => null }));
vi.mock("@/app/components/CouponSection", () => ({ default: () => null }));
vi.mock("@/app/components/FrequentlyBoughtTogether", () => ({ FrequentlyBoughtTogether: () => null }));
vi.mock("@/app/components/ProductImage", () => ({ ProductImage: () => null }));
vi.mock("@/context/CartContext", () => ({
    useCartContext: () => ({ items: contextItems, updateQuantity: updateContextQuantity, removeFromCart: vi.fn() }),
}));
vi.mock("@/services/api", () => ({
    apiService: {
        isAuthenticated: () => true,
        getRetailerDetails: async () => ({ minimum_order_amount: "0" }),
        getCart: async () => ({ total_amount: "100", items: [line] }),
    },
}));

import CartPage from "./page";

async function renderCart() {
    render(<CartPage />);
    return (await screen.findByLabelText("Quantity")) as HTMLInputElement;
}

function typeQty(input: HTMLInputElement, value: string) {
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("current_retailer_id", "1");
    line = { id: 7, product: 70, product_name: "Rice", product_price: 50, quantity: 2, stock_quantity: 5, minimum_order_quantity: 2, maximum_order_quantity: 4 };
});
afterEach(() => { cleanup(); localStorage.clear(); });

describe("cart quantity bounds", () => {
    it("zero, negative and non-numeric quantities revert without an update", async () => {
        const input = await renderCart();
        for (const bad of ["0", "-3", "abc", ""]) {
            typeQty(input, bad);
            expect(input.value).toBe("2");
        }
        expect(updateContextQuantity).not.toHaveBeenCalled();
    });

    it("above the max order quantity is clamped to the max with a message", async () => {
        const input = await renderCart();
        typeQty(input, "9");
        expect(toastError).toHaveBeenCalledWith("Maximum order limit is 4");
        expect(updateContextQuantity).toHaveBeenCalledWith(70, 4);
    });

    it("above stock (no max set) is clamped to stock", async () => {
        line = { ...line, maximum_order_quantity: null };
        const input = await renderCart();
        typeQty(input, "50");
        expect(toastError).toHaveBeenCalledWith("Maximum order limit is 5");
        expect(updateContextQuantity).toHaveBeenCalledWith(70, 5);
    });

    it("below the minimum is raised to the minimum; unchanged qty sends nothing", async () => {
        line = { ...line, quantity: 3 };
        const input = await renderCart();
        typeQty(input, "1");
        expect(toastError).toHaveBeenCalledWith("Minimum order quantity is 2");
        expect(updateContextQuantity).toHaveBeenCalledWith(70, 2);
    });

    it("plus at the max order quantity is refused", async () => {
        line = { ...line, quantity: 4 };
        await renderCart();
        fireEvent.click(screen.getByLabelText("Increase quantity"));
        expect(toastError).toHaveBeenCalledWith("Maximum order limit is 4");
        expect(updateContextQuantity).not.toHaveBeenCalled();
    });

    it("minus at the minimum removes the line (qty 0), never goes below", async () => {
        await renderCart();
        fireEvent.click(screen.getByLabelText("Decrease quantity"));
        expect(updateContextQuantity).toHaveBeenCalledWith(70, 0);
    });
});
