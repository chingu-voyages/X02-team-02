import type {
  RegisterRequest,
  AuthResponse,
  ErrorResponse,
  ValidationErrorResponse,
} from "@x02/shared/src/index";

class ApiError extends Error {
  status: number;
  body: ErrorResponse | ValidationErrorResponse | null;

  constructor(
    status: number,
    body: ErrorResponse | ValidationErrorResponse | null,
  ) {
    super(body?.error ?? "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function registerUser(
  data: RegisterRequest,
): Promise<AuthResponse> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body as AuthResponse;
}
