import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.tsx";

vi.mock("./auth/AuthProvider.tsx", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("./pages/ForgotPasswordPage.tsx", () => ({
  default: () => <h1>Forgot Password Route</h1>,
}));

vi.mock("./pages/ResetPasswordPage.tsx", () => ({
  default: () => <h1>Reset Password Route</h1>,
}));

vi.mock("./pages/HomePage.tsx", () => ({
  default: () => <h1>Home Route</h1>,
}));

vi.mock("./pages/LoginPage.tsx", () => ({
  default: () => <h1>Login Route</h1>,
}));

vi.mock("./pages/RegisterPage.tsx", () => ({
  default: () => <h1>Register Route</h1>,
}));

describe("Password reset routes", () => {
  it("registers the forgot password route", () => {
    window.history.pushState({}, "", "/forgot-password");

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Forgot Password Route" }),
    ).toBeInTheDocument();
  });

  it("registers the reset password route", () => {
    window.history.pushState(
      {},
      "",
      "/reset-password?token=valid-token",
    );

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Reset Password Route" }),
    ).toBeInTheDocument();
  });

  it("keeps the password reset routes accessible without authentication", () => {
    window.history.pushState({}, "", "/forgot-password");

    render(<App />);

    expect(
      screen.queryByRole("heading", { name: "Login Route" }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Forgot Password Route" }),
    ).toBeInTheDocument();
  });
});
