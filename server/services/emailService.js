import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export async function sendRegistrationEmail({ to, name, teamName }) {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "IEEE Hackathon Registration Confirmed",
    html: `<p>Hello ${name},</p><p>Your registration is confirmed for team <strong>${teamName}</strong>.</p><p>See you at the hackathon.</p>`
  });
}
