import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// API, map, saved location and navigation are mocked: nothing here talks to a real host.
const addAddress = vi.fn();
const handleBack = vi.fn();
const toastError = vi.fn();
const pin = { lat: 18.52, lng: 73.85 };
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/hooks/useAppNavigation", () => ({ useAppNavigation: () => ({ handleBack }) }));
vi.mock("@/lib/toast", () => ({ default: { error: (m: string) => toastError(m), success: vi.fn() } }));
vi.mock("@/utils/location", () => ({ getPersistedLocation: () => null, matchAvailableCity: () => null }));
vi.mock("@/app/components/PageHeader", () => ({ default: () => null }));
vi.mock("@/services/api", () => ({ apiService: { addAddress: (a: unknown) => addAddress(a) } }));
vi.mock("@/app/components/MapPicker", () => ({
    default: (p: { onLocationSelect: (...a: unknown[]) => void }) => (
        <button type="button" onClick={() => p.onLocationSelect(pin.lat, pin.lng, "12 MG Road", "411001", "", "")}>pick-on-map</button>
    ),
}));

import NewAddressPage from "./page";

function fillText(placeholder: string, value: string) {
    fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
}
const form = () => screen.getByPlaceholderText("Home").closest("form")!;

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<NewAddressPage />);
});
afterEach(cleanup);

describe("new address form", () => {
    it("without a map pin (0,0) it refuses to save", async () => {
        fillText("Home", "Home");
        fillText("House No, Building", "12 MG Road");
        fillText("000000", "411001");
        fireEvent.submit(form());
        await waitFor(() => expect(toastError).toHaveBeenCalledWith("Please set your location on the map before saving."));
        expect(addAddress).not.toHaveBeenCalled();
    });

    it("label, line 1, state, city and pincode are required in the markup", () => {
        for (const ph of ["Home", "House No, Building", "000000"]) expect((screen.getByPlaceholderText(ph) as HTMLInputElement).required).toBe(true);
        const selects = form().querySelectorAll("select[required]");
        expect([...selects].map((s) => s.getAttribute("name")).sort()).toEqual(["city", "state"]);
        expect((screen.getByPlaceholderText("Street, Area") as HTMLInputElement).required).toBe(false);
    });

    it("empty form is invalid, so a browser submit is blocked", () => {
        expect(form().checkValidity()).toBe(false);
        fireEvent.click(screen.getByText("pick-on-map"));
        // A map pick fills line 1 and pincode but not label, state or city.
        expect(form().checkValidity()).toBe(false);
    });

    it("pincode is capped at 6 characters", () => {
        expect(screen.getByPlaceholderText("000000").getAttribute("maxlength")).toBe("6");
    });

    it("city stays disabled until a state is picked", () => {
        expect((form().querySelector('select[name="city"]') as HTMLSelectElement).disabled).toBe(true);
    });

    it("API failure keeps the user on the form", async () => {
        addAddress.mockRejectedValue({ response: { status: 400 } });
        fireEvent.click(screen.getByText("pick-on-map"));
        fillText("Home", "Home");
        fireEvent.submit(form());
        await waitFor(() => expect(addAddress).toHaveBeenCalled());
        expect(addAddress.mock.calls[0][0]).toMatchObject({ latitude: pin.lat, longitude: pin.lng, address_line1: "12 MG Road", pincode: "411001" });
        expect(handleBack).not.toHaveBeenCalled();
    });
});
