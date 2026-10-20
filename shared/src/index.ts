// Shared types and utilities used by both @x02/client and @x02/server.

// API contract for /api/auth/*. The agreed shape is documented in issue #37.
// These are compile-time types only: the server must still validate real input.

// A string union (not a TypeScript enum) because the client uses erasableSyntaxOnly.
// The values match the UserRole enum in the Prisma schema.
export type UserRole = "LEARNER" | "QUESTION_MANAGER" | "ADMIN";

// What the API returns for a user. Never includes passwordHash.
export type User = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
};

// POST /api/auth/register
export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

// POST /api/auth/login
export type LoginRequest = {
  email: string;
  password: string;
};

// Success body for register (201), login (200), and GET /api/auth/me (200).
export type AuthResponse = {
  user: User;
};

// Every error response has an `error` message.
export type ErrorResponse = {
  error: string;
};

export type FieldError = {
  field: string;
  message: string;
};

// 400 from register: `error` is a short summary and `fieldErrors` lets the
// forms show a message beside each input.
export type ValidationErrorResponse = ErrorResponse & {
  fieldErrors: FieldError[];
};
