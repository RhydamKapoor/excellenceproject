import nodemailer from "nodemailer";
import { emailConfig } from "@/lib/serverConfig";

function normalizeEmailCredential(value) {
  if (!value) return "";
  return value.trim().replace(/^["']|["']$/g, "");
}

function normalizeEmailPassword(value) {
  // Gmail app passwords are 16 chars; spaces in .env break AUTH PLAIN
  return normalizeEmailCredential(value).replace(/\s/g, "");
}

export function getEmailConfig() {
  const user = normalizeEmailCredential(process.env.EMAIL_USER);
  const pass = normalizeEmailPassword(process.env.EMAIL_PASS);

  if (!user || !pass) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set in environment variables");
  }

  return { user, pass };
}

export function getMailTransporter() {
  const { user, pass } = getEmailConfig();

  return nodemailer.createTransport({
    service: emailConfig.service,
    auth: { user, pass },
  });
}

export async function sendMail({ to, subject, text, html }) {
  const { user } = getEmailConfig();
  const transporter = getMailTransporter();

  await transporter.sendMail({
    from: `"${emailConfig.fromName}" <${user}>`,
    to,
    subject,
    text,
    html,
  });
}
