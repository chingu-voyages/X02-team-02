import { randomBytes } from "node:crypto";
import { prisma } from "../../db/prisma.js";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// The token is the session id and goes into the session cookie, so it comes
// from a secure random generator and is long enough that it cannot be guessed.
export async function createSession(userId: string) {
  const id = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({ data: { id, userId, expiresAt } });

  return { id, expiresAt };
}

// Returns the logged-in user, or null when the session is missing or expired.
// Expired rows are deleted here, so they only linger until someone uses them.
export async function getSessionUser(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
    return null;
  }

  return session.user;
}

// deleteMany does not throw when the row is already gone, which suits logout.
export async function deleteSession(sessionId: string) {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}
