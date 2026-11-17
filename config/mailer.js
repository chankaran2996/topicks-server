import './env.js';
import nodemailer from 'nodemailer';

const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT, EMAIL_FROM } = process.env;
export const mailConfigured = Boolean(EMAIL_USER && EMAIL_PASS);

// Gmail by default (use an App Password); set EMAIL_HOST/EMAIL_PORT for other providers.
const transporter = mailConfigured
  ? nodemailer.createTransport(
      EMAIL_HOST
        ? { host: EMAIL_HOST, port: Number(EMAIL_PORT) || 587, secure: Number(EMAIL_PORT) === 465, auth: { user: EMAIL_USER, pass: EMAIL_PASS } }
        : { service: 'gmail', auth: { user: EMAIL_USER, pass: EMAIL_PASS } }
    )
  : null;

export async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    // Email not set up yet: print it so links can still be used during development.
    console.log(`\n[mail not configured] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  await transporter.sendMail({ from: EMAIL_FROM || `Topicks <${EMAIL_USER}>`, to, subject, html, text });
}
