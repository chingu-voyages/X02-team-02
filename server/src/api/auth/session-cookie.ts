import type { Response } from "express";

export const SESSION_COOKIE_NAME = "sid";

// HttpOnly keeps scripts from reading the cookie. Secure is only turned on in
// production so the cookie still works on plain http://localhost in development.
// Set and clear must use the same options, or the browser keeps the old cookie.
function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function setSessionCookie(
  res: Response,
  session: { id: string; expiresAt: Date },
) {
  res.cookie(SESSION_COOKIE_NAME, session.id, {
    ...cookieOptions(),
    expires: session.expiresAt,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, cookieOptions());
}
