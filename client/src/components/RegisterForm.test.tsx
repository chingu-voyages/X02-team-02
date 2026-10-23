import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import RegisterForm from "./RegisterForm.tsx";
import { register } from "../api/auth.ts";
import { ApiError } from "../api/client.ts";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";

vi.mock("../api/auth.ts", () => ({ register: vi.fn() }));
const mockRegister = vi.mocked(register);

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all fields and the submit button", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Password", { exact: true }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /register/i }),
    ).toBeInTheDocument();
  });

  it("submits valid data without confirmPassword", async () => {
    mockRegister.mockResolvedValue({
      user: {
        id: "123",
        username: "test",
        email: "test@example.com",
        role: "LEARNER",
      },
    });
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Username"), "test");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Password1!",
    );
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister).toHaveBeenCalledWith({
      username: "test",
      email: "test@example.com",
      password: "Password1!",
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Account added.",
    );
    expect(screen.getByLabelText("Username")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password", { exact: true })).toHaveValue("");
    expect(screen.getByLabelText("Confirm password")).toHaveValue("");
  });

  it("displays an error when email already exists", async () => {
    mockRegister.mockRejectedValue(
      new ApiError(409, "An account with this email already exists."),
    );
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Username"), "test");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Password1!",
    );
    await user.type(screen.getByLabelText("Confirm password"), "Password1!");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An account with this email already exists.",
    );
    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("displays an error when passwords don't match", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Username"), "test");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Password1!",
    );
    await user.type(screen.getByLabelText("Confirm password"), "password1!");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Passwords don't match",
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
