import { Resend } from "resend";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Sends a password-reset email through Resend.
 *
 * Keep RESEND_API_KEY on the server only. For initial testing, EMAIL_FROM can
 * be onboarding@resend.dev; Resend restricts test-sender delivery to the
 * account owner's verified email address.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  const resend = new Resend(getRequiredEnv("RESEND_API_KEY"));
  const from = getRequiredEnv("EMAIL_FROM");

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Reset your VoyageXP password",
    text: [
      "We received a request to reset your VoyageXP password.",
      "",
      "Use the link below within 30 minutes to choose a new password:",
      resetUrl,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: [
      "<p>We received a request to reset your VoyageXP password.</p>",
      `<p><a href="${escapeHtmlAttribute(resetUrl)}">Reset your password</a></p>`,
      "<p>This link expires in 30 minutes and can only be used once.</p>",
      "<p>If you did not request this, you can ignore this email.</p>",
    ].join("\n"),
  });

  if (error) {
    throw new Error(`Unable to send password reset email: ${error.message}`);
  }
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
