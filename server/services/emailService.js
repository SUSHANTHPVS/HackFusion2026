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

function getAlertRecipients() {
  const configured = String(env.PAYMENT_ALERT_EMAILS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  return [env.SMTP_USER];
}

export async function sendPaymentDisputeAlertEmail({
  eventType,
  disputeId,
  paymentId,
  orderId,
  amount,
  currency,
  reasonCode,
  reasonDescription,
  phase,
  disputeStatus,
  participantEmail,
  teamName
}) {
  const recipients = getAlertRecipients();
  const amountInMajor = typeof amount === "number" ? (amount / 100).toFixed(2) : "N/A";

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: recipients.join(","),
    subject: `Razorpay Dispute Alert: ${eventType}`,
    html: `
      <h3>Razorpay Dispute Alert</h3>
      <p><strong>Event:</strong> ${eventType}</p>
      <p><strong>Dispute ID:</strong> ${disputeId || "N/A"}</p>
      <p><strong>Dispute Status:</strong> ${disputeStatus || "N/A"}</p>
      <p><strong>Phase:</strong> ${phase || "N/A"}</p>
      <p><strong>Order ID:</strong> ${orderId || "N/A"}</p>
      <p><strong>Payment ID:</strong> ${paymentId || "N/A"}</p>
      <p><strong>Amount:</strong> ${amountInMajor} ${currency || "INR"}</p>
      <p><strong>Reason Code:</strong> ${reasonCode || "N/A"}</p>
      <p><strong>Reason:</strong> ${reasonDescription || "N/A"}</p>
      <p><strong>Participant Email:</strong> ${participantEmail || "N/A"}</p>
      <p><strong>Team:</strong> ${teamName || "N/A"}</p>
      <p>Please review this dispute in Razorpay dashboard and take action if required.</p>
    `
  });
}
