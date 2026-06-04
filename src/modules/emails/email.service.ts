import { env } from "../../config/env.js";
import { resend } from "../../config/resend.js";

async function sendEmail(to: string, subject: string, html: string) {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html
  });
}

export async function sendVerificationEmail(to: string, fullName: string, token: string) {
  await sendEmail(
    to,
    "Verify your What Should I Wear? account",
    `
      <p>Hello ${escapeHtml(fullName)},</p>
      <p>Use this verification token to activate your account:</p>
      <p><strong>${token}</strong></p>
      <p>This token expires in 24 hours.</p>
    `
  );
}

export async function sendPasswordResetEmail(to: string, fullName: string, token: string) {
  await sendEmail(
    to,
    "Reset your What Should I Wear? password",
    `
      <p>Hello ${escapeHtml(fullName)},</p>
      <p>Use this password reset token:</p>
      <p><strong>${token}</strong></p>
      <p>This token expires in 30 minutes.</p>
    `
  );
}

export async function sendWelcomeEmail(to: string, fullName: string) {
  await sendEmail(
    to,
    "Welcome to What Should I Wear?",
    `
      <p>Hello ${escapeHtml(fullName)},</p>
      <p>Your account is ready. Start building your wardrobe and let your AI stylist help you dress with confidence.</p>
    `
  );
}

export async function sendEventReminderEmail(to: string, fullName: string, input: {
  eventTitle: string;
  eventDate: string;
  outfitTitle?: string | null;
  outfitSummary?: string | null;
  finalChecklist?: string[];
}) {
  const checklist = (input.finalChecklist ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  await sendEmail(
    to,
    `Styling reminder: ${input.eventTitle}`,
    `
      <p>Hello ${escapeHtml(fullName)},</p>
      <p>Your event <strong>${escapeHtml(input.eventTitle)}</strong> is coming up on ${escapeHtml(input.eventDate)}.</p>
      ${input.outfitTitle ? `<p>Selected outfit: <strong>${escapeHtml(input.outfitTitle)}</strong></p>` : ""}
      ${input.outfitSummary ? `<p>${escapeHtml(input.outfitSummary)}</p>` : ""}
      ${checklist ? `<p>Final checklist:</p><ul>${checklist}</ul>` : ""}
    `
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    };
    return entities[char] ?? char;
  });
}
