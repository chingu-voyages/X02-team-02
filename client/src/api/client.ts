// client/src/api/client.ts
import type { FieldError, ValidationErrorResponse } from "@x02/shared";

export class ApiError extends Error {
  status: number;
  fieldErrors: FieldError[];

  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const failure = data as Partial<ValidationErrorResponse> | null;
    throw new ApiError(
      response.status,
      failure?.error ?? "Something went wrong.",
      failure?.fieldErrors,
    );
  }

  if (data === null) {
    throw new ApiError(response.status, "Unexpected response from the server.");
  }

  return data as T;
}