import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ForgotPasswordPage from "./ForgotPasswordPage.tsx";

vi.mock("../components/ForgotPasswordForm.tsx", () => ({
  default: () => <div data-testid="forgot-password-form" />,
}));

describe("ForgotPasswordPage", () => {
  it("renders the page heading and instructions", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Forgot password?" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /enter your email address and we'll send you a link to reset your password/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the forgot password form", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("forgot-password-form")).toBeInTheDocument();
  });

  it("provides a link back to the login page", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("provides a link to the home page", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Logo" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
