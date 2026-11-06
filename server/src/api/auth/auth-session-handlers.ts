import type { Request, Response } from "express";
import { deleteSession } from "./session.js";
import {
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from "./session-cookie.js";

export async function logout(
  req: Request,
  res: Response,
): Promise<void> {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

  if (typeof sessionId === "string" && sessionId) {
    await deleteSession(sessionId);
  }

  clearSessionCookie(res);
  res.status(204).end();
}

export function me(
  req: Request,
  res: Response,
): void {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      error: "Authentication required.",
    });
    return;
  }

  res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
}
