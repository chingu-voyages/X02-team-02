import { describe, it, expect } from "vitest";
import { registerFormSchema } from "./schemas";

const validRegisterInput = {
  username: "  testname ",
  email: " test@example.com ",
  password: "Password1!",
  confirmPassword: "Password1!",
};

describe("registerFormSchema", () => {
  it("accepts fully valid input", () => {
    const result = registerFormSchema.safeParse(validRegisterInput);

    expect(result.success).toBe(true);
  });

  describe("username", () => {
    it("should fail when empty", () => {
      const input = { ...validRegisterInput, username: "" };
      const result = registerFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Username must be at least 1 character.",
      );
      expect(result.error?.issues[0].path).toEqual(["username"]);
    });

    it("should fail when white-space only", () => {
      const input = { ...validRegisterInput, username: "     " };
      const result = registerFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Username must be at least 1 character.",
      );
      expect(result.error?.issues[0].path).toEqual(["username"]);
    });

    it("should fail when it is longer than 50 characters", () => {
      const input = { ...validRegisterInput, username: "x".repeat(51) };
      const result = registerFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Username must not exceed 50 characters.",
      );
      expect(result.error?.issues[0].path).toEqual(["username"]);
    });
  });

  describe("email", () => {
    it("should fail when in invalid format", () => {
      const input = { ...validRegisterInput, email: "testexample.com" };
      const result = registerFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Enter a valid email address.",
      );
      expect(result.error?.issues[0].path).toEqual(["email"]);
    });

    it("should fail when it is longer than 255 characters", () => {
      const input = {
        ...validRegisterInput,
        email: "x".repeat(256) + "@example.com",
      };
      const result = registerFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Email cannot exceed 255 characters.",
      );
      expect(result.error?.issues[0].path).toEqual(["email"]);
    });
  });

  describe("password", () => {
    it.each([
      [
        "is shorter than 8 characters",
        "Abc1!",
        "Password must be at least 8 characters.",
      ],
      [
        "is longer than 64 characters",
        "x".repeat(65),
        "Password must not exceed 64 characters.",
      ],
      [
        "has no lowercase letter",
        "PASSWORD1!",
        "Must contain at least one lowercase letter",
      ],
      [
        "has no uppercase letter",
        "password1!",
        "Must contain at least one uppercase letter",
      ],
      [
        "has no uppercase number",
        "password!",
        "Must contain at least one number",
      ],
      [
        "has no uppercase special character",
        "password1",
        "Must contain at least one special character",
      ],
    ])("should fail when it %s", (_description, password, message) => {
      const result = registerFormSchema.safeParse({
        ...validRegisterInput,
        password,
        confirmPassword: password,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toContainEqual(
        expect.objectContaining({ message, path: ["password"] }),
      );
    });
  });

  describe("confirmPassword", () => {
    it("should fail when empty", () => {
      const input = { ...validRegisterInput, confirmPassword: "" };
      const result = registerFormSchema.safeParse(input);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Please confirm your password",
      );
      expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
    });
  });
});
