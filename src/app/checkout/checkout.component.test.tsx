import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// The whole API layer is mocked: nothing here talks to a real host.
const toastError = vi.fn();
const placeOrder = vi.fn();
const api = {
    profile: { is_phone_verified: true, phone_number: "9000000001" } as Record<string, unknown>,
    addresses: [{ id: 11, title: "Home", address_line1: "12 MG Road", city: "Pune", pincode: "411001", latitude: 18.52, longitude: 73.85 }] as Record<string, unknown>[],
    cart: { total_amount: "300", items: [{ id: 1, product: 5, product_name: "Atta", quantity: 1, unit_price: "300", total_price: "300" }] } as Record<string, unknown>,
    retailer: { offers_delivery: true, offers_pickup: true, accepts_cod: true, accepts_upi: false, minimum_order_amount: "0", delivery_charge: "0" } as Record<string, unknown>,
    quote: null as unknown,
};
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/hooks/useAppNavigation", () => ({ useAppNavigation: () => ({ handleBack: vi.fn() }) }));
vi.mock("@/lib/toast", () => ({ default: { error: (m: string) => toastError(m), success: vi.fn() } }));
vi.mock("@/app/components/PageHeader", () => ({ default: () => null }));
vi.mock("@/app/components/CouponSection", () => ({ default: () => null }));
vi.mock("@/app/components/FulfillmentSlotPicker", () => ({ default: () => null }));
vi.mock("@/app/components/auth/PhoneVerification", () => ({ default: (p: { isOpen: boolean }) => (p.isOpen ? <div>verify-phone-dialog</div> : null) }));
vi.mock("@/services/api", () => ({
    apiService: {
        isAuthenticated: () => true,
        fetchUserProfile: async () => api.profile,
        getAddresses: async () => api.addresses,
        getCart: async () => api.cart,
        getRetailerDetails: async () => api.retailer,
        fetchRewardConfiguration: async () => ({}),
        getCustomerLoyalty: async () => ({ points: 0 }),
        getDeliveryQuote: async () => api.quote,
        placeOrder: (p: unknown) => placeOrder(p),
    },
}));

import CheckoutPage from "./page";

const placeButton = () => screen.getByTestId("checkout-place-order") as HTMLButtonElement;

async function renderLoaded() {
    render(<CheckoutPage />);
    await waitFor(() => expect(placeButton().textContent).toMatch(/Place Order|more to order|Outside/));
    // Wait for the loaded state itself: saved addresses listed, and the verify dialog for an unverified mobile.
    await waitFor(() => {
        for (const a of api.addresses) expect(screen.getByText(new RegExp(String(a.address_line1)))).toBeTruthy();
        if (!api.profile.is_phone_verified) expect(screen.getByText("verify-phone-dialog")).toBeTruthy();
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("current_retailer_id", "1");
    api.profile = { is_phone_verified: true, phone_number: "9000000001" };
    api.addresses = [{ id: 11, title: "Home", address_line1: "12 MG Road", city: "Pune", pincode: "411001", latitude: 18.52, longitude: 73.85 }];
    api.cart = { total_amount: "300", items: [{ id: 1, product: 5, product_name: "Atta", quantity: 1, unit_price: "300", total_price: "300" }] };
    api.retailer = { offers_delivery: true, offers_pickup: true, accepts_cod: true, accepts_upi: false, minimum_order_amount: "0", delivery_charge: "0" };
    api.quote = null;
});
afterEach(() => { cleanup(); localStorage.clear(); });

describe("checkout guards (no order is placed)", () => {
    it("unverified mobile opens phone verification instead of ordering", async () => {
        api.profile = { is_phone_verified: false, phone_number: "" };
        await renderLoaded();
        expect(screen.getByText("verify-phone-dialog")).toBeTruthy();
        fireEvent.click(placeButton());
        expect(placeOrder).not.toHaveBeenCalled();
    });

    it("no saved address: asks for a delivery address", async () => {
        api.addresses = [];
        await renderLoaded();
        fireEvent.click(placeButton());
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Please select a delivery address."));
        expect(placeOrder).not.toHaveBeenCalled();
    });

    it("address without map coordinates is refused", async () => {
        api.addresses = [{ id: 12, title: "Old", address_line1: "x", latitude: 0, longitude: 0 }];
        await renderLoaded();
        fireEvent.click(placeButton());
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Please update your delivery address with a map location before ordering."));
        expect(placeOrder).not.toHaveBeenCalled();
    });

    it("empty cart is refused", async () => {
        api.cart = { total_amount: "0", items: [] };
        await renderLoaded();
        fireEvent.click(placeButton());
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Your cart is empty. Add items before placing an order."));
        expect(placeOrder).not.toHaveBeenCalled();
    });

    it("below the minimum order the button is disabled and says how much to add", async () => {
        api.retailer = { ...api.retailer, minimum_order_amount: "500" };
        await renderLoaded();
        await waitFor(() => expect(placeButton().textContent).toContain("Add ₹200 more to order"));
        expect(placeButton().disabled).toBe(true);
    });

    it("out-of-radius quote disables ordering", async () => {
        api.quote = { deliverable: false, delivery_fee: 0, reason: "Outside delivery radius" };
        await renderLoaded();
        await waitFor(() => expect(placeButton().textContent).toBe("Outside delivery area"));
        expect(placeButton().disabled).toBe(true);
        expect(placeOrder).not.toHaveBeenCalled();
    });

    it("lost retailer id is refused before any API call", async () => {
        await renderLoaded();
        localStorage.removeItem("current_retailer_id");
        fireEvent.click(placeButton());
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Retailer session lost. Please go back to cart."));
        expect(placeOrder).not.toHaveBeenCalled();
    });
});
