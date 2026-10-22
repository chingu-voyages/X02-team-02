import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE_NAME } from "./session-cookie.js";
import { getSessionUser } from "./session.js";

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof getSessionUser>>
>;

// Tells TypeScript that a request may carry the logged-in user.
declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

// Works out who is logged in and attaches them to the request. It only
// identifies: it always calls next(), so public routes keep working. Needs
// cookie-parser to run first. Express 5 forwards errors thrown here.
export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

  if (typeof sessionId === "string" && sessionId) {
    const user = await getSessionUser(sessionId);

    if (user) {
      req.user = user;
    }
  }

  next();
}

// Blocks the request unless attachUser found a logged-in user.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  next();
}
