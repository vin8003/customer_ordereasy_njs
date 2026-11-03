import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// API, Firebase, Capacitor and router are mocked: nothing here talks to a real host.
const push = vi.fn();
const login = vi.fn();
const googleLogin = vi.fn();
const setAuthToken = vi.fn();
const syncGuestCart = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock("../../services/api", () => ({
    apiService: { login: (...a: unknown[]) => login(...a), googleLogin: (...a: unknown[]) => googleLogin(...a) },
    setAuthToken: (...a: unknown[]) => setAuthToken(...a),
}));
vi.mock("../../services/firebase", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({
    GoogleAuthProvider: class { setCustomParameters() {} static credential() { return {}; } },
    signInWithPopup: async () => ({ user: { getIdToken: async () => "google-id-token" } }),
    signInWithCredential: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock("@codetrix-studio/capacitor-google-auth", () => ({ GoogleAuth: { initialize: vi.fn(), signIn: vi.fn() } }));
vi.mock("@/context/CartContext", () => ({ useCartContext: () => ({ syncGuestCart }) }));
vi.mock("@/app/components/BrandLogo", () => ({ default: () => null }));
vi.mock("@/app/components/LoadingScreen", () => ({ default: () => null }));

import LoginPage from "./page";

async function submit(phone: string, password: string) {
    const user = userEvent.setup();
    render(<LoginPage />);
    if (phone) await user.type(screen.getByTestId("customer-login-phone"), phone);
    if (password) await user.type(screen.getByTestId("customer-login-password"), password);
    await user.click(screen.getByTestId("customer-login-submit"));
    return user;
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(cleanup);

describe("customer login - password", () => {
    it("empty fields: the browser's required check stops the submit, no API call", async () => {
        await submit("", "");
        expect(login).not.toHaveBeenCalled();
        expect((screen.getByTestId("customer-login-phone") as HTMLInputElement).validity.valueMissing).toBe(true);
    });

    it("empty password alone is also stopped", async () => {
        await submit("9000000001", "");
        expect(login).not.toHaveBeenCalled();
    });

    it("phone field is capped at 10 characters", async () => {
        await submit("9000000001", "pw");
        expect(screen.getByTestId("customer-login-phone").getAttribute("maxlength")).toBe("10");
    });

    it("wrong password (401, no detail) shows the generic message and stores no token", async () => {
        login.mockRejectedValue({ response: { status: 401, data: {} } });
        await submit("9000000001", "wrong");
        expect(await screen.findByTestId("customer-login-error")).toHaveProperty("textContent", "Invalid phone number or password");
        expect(setAuthToken).not.toHaveBeenCalled();
        expect(syncGuestCart).not.toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
    });

    it("server detail wins over the generic message", async () => {
        login.mockRejectedValue({ response: { status: 400, data: { detail: "Account is disabled" } } });
        await submit("9000000001", "pw");
        expect((await screen.findByTestId("customer-login-error")).textContent).toBe("Account is disabled");
    });

    it("network error shows the retry message", async () => {
        login.mockRejectedValue(new Error("Network Error"));
        await submit("9000000001", "pw");
        expect((await screen.findByTestId("customer-login-error")).textContent).toBe("An unexpected error occurred. Please try again.");
    });

    it("a 200 without tokens is treated as a failure, not a login", async () => {
        login.mockResolvedValue({ user: {} });
        await submit("9000000001", "pw");
        expect((await screen.findByTestId("customer-login-error")).textContent).toBe("Login failed: Invalid response format");
        expect(setAuthToken).not.toHaveBeenCalled();
    });

    it("unverified email redirects to verify-email instead of logging in", async () => {
        login.mockRejectedValue({ response: { status: 403, data: { code: "email_not_verified", email: "a+b@x.test" } } });
        await submit("9000000001", "pw");
        await waitFor(() => expect(push).toHaveBeenCalledWith("/verify-email?email=a%2Bb%40x.test"));
        expect(setAuthToken).not.toHaveBeenCalled();
    });
});

describe("customer login - Google phone + OTP", () => {
    async function toPhoneStep() {
        googleLogin.mockResolvedValueOnce({ status: "phone_required" });
        const user = userEvent.setup();
        render(<LoginPage />);
        await user.click(screen.getByText(/google/i, { selector: "button, button *" }));
        await screen.findByText("Complete Setup");
        return user;
    }

    it("short phone number is refused client-side", async () => {
        await toPhoneStep();
        fireEvent.change(screen.getByPlaceholderText("Enter 10 digit number"), { target: { value: "98765" } });
        fireEvent.submit(screen.getByText("Complete Setup").closest("form")!);
        expect(await screen.findByText("Please enter a valid 10-digit number")).toBeTruthy();
        expect(googleLogin).toHaveBeenCalledTimes(1);
    });

    async function toOtpStep() {
        const user = await toPhoneStep();
        googleLogin.mockResolvedValueOnce({ status: "otp_required" });
        await user.type(screen.getByPlaceholderText("Enter 10 digit number"), "9876543210");
        await user.click(screen.getByText("Complete Setup"));
        await screen.findByPlaceholderText("Enter 6 digit OTP");
        return user;
    }

    it("OTP shorter than 6 digits is refused client-side", async () => {
        await toOtpStep();
        fireEvent.change(screen.getByPlaceholderText("Enter 6 digit OTP"), { target: { value: "123" } });
        fireEvent.submit(screen.getByText("Verify & Link Account").closest("form")!);
        expect(await screen.findByText("Please enter a 6-digit verification code")).toBeTruthy();
        expect(googleLogin).toHaveBeenCalledTimes(2);
    });

    it("wrong OTP: server error shown, no token, still on the OTP step", async () => {
        const user = await toOtpStep();
        googleLogin.mockRejectedValueOnce({ response: { status: 400, data: { error: "Invalid OTP" } } });
        await user.type(screen.getByPlaceholderText("Enter 6 digit OTP"), "000000");
        await user.click(screen.getByText("Verify & Link Account"));
        expect(await screen.findByText("Invalid OTP")).toBeTruthy();
        expect(googleLogin).toHaveBeenLastCalledWith("google-id-token", "9876543210", "000000");
        expect(setAuthToken).not.toHaveBeenCalled();
        expect(screen.getByPlaceholderText("Enter 6 digit OTP")).toBeTruthy();
    });

    it("expired OTP without a body falls back to the generic message", async () => {
        const user = await toOtpStep();
        googleLogin.mockRejectedValueOnce(new Error("timeout"));
        await user.type(screen.getByPlaceholderText("Enter 6 digit OTP"), "123456");
        await user.click(screen.getByText("Verify & Link Account"));
        expect(await screen.findByText("Verification failed. Invalid or expired OTP.")).toBeTruthy();
        expect(push).not.toHaveBeenCalled();
    });
});
