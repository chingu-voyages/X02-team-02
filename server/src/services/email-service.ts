import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { Resend } from "resend";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// server/src/services/email-service.ts -> server/src/services -> server/src -> server -> repository root
dotenv.config({
  path: path.resolve(currentDir, "../../../.env"),
});

const RESET_LINK_EXPIRATION_MINUTES = 30;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sends a password reset email to the given address.
 * Email provider specific implementation that can be replaced with another.
 * @param email - The user's email address.
 * @param resetUrl - The link to choose a new password.
 * @throws {Error} Failed to send password reset email.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  const apiKey = getRequiredEnv("RESEND_API_KEY");

  // Resend's test sender can be used until a project domain is verified.
  const from =
    process.env.EMAIL_FROM?.trim() || "onboarding@resend.dev";

  const resend = new Resend(apiKey);
  const safeResetUrl = escapeHtml(resetUrl);

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Reset your VoyageXP password",
    text: [
      "We received a request to reset your VoyageXP password.",
      "",
      "Use the link below to choose a new password:",
      resetUrl,
      "",
      `This link expires in ${RESET_LINK_EXPIRATION_MINUTES} minutes and can only be used once.`,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <h2>Reset your VoyageXP password</h2>
      <p>
        We received a request to reset your VoyageXP password.
      </p>
      <p>
        <a href="${safeResetUrl}">Reset your password</a>
      </p>
      <p>
        This link expires in ${RESET_LINK_EXPIRATION_MINUTES} minutes
        and can only be used once.
      </p>
      <p>
        If you did not request this, you can ignore this email.
      </p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
