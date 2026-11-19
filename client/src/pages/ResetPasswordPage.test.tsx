import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import ResetPasswordPage from "./ResetPasswordPage.tsx";

vi.mock("../components/ResetPasswordForm.tsx", () => ({
  default: ({ token }: { token: string }) => (
    <div data-testid="reset-password-form" data-token={token} />
  ),
}));

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ResetPasswordPage", () => {
  it("renders the page heading and instructions when a token is present", () => {
    renderPage("/reset-password?token=valid-token");

    expect(
      screen.getByRole("heading", { name: "Reset your password" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Choose a new password for your account."),
    ).toBeInTheDocument();
  });

  it("renders the reset password form when a token is present", () => {
    renderPage("/reset-password?token=valid-token");

    expect(screen.getByTestId("reset-password-form")).toBeInTheDocument();
  });

  it("passes the token from the URL to the reset password form", () => {
    renderPage("/reset-password?token=valid-token");

    expect(screen.getByTestId("reset-password-form")).toHaveAttribute(
      "data-token",
      "valid-token",
    );
  });

  it("shows an error when the token is missing", () => {
    renderPage("/reset-password");

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent("This password reset link is invalid or missing.");

    expect(
      screen.queryByTestId("reset-password-form"),
    ).not.toBeInTheDocument();
  });

  it("provides a link to request another reset link when the token is missing", () => {
    renderPage("/reset-password");

    expect(
      screen.getByRole("link", { name: "Request another reset link" }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("provides a link to the home page", () => {
    renderPage("/reset-password?token=valid-token");

    expect(screen.getByRole("link", { name: "Logo" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
