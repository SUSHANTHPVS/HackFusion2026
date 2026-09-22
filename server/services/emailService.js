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

export async function sendPaymentApprovalEmail({ to, name, teamName, amount, whatsappLink }) {
  const amountFormatted = typeof amount === "number" ? `₹${amount.toFixed(2)}` : `₹${amount}`;
  
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "🎉 Payment Approved - Join the Hackathon WhatsApp Group",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">✅ Payment Approved!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your hackathon registration is confirmed</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
          <p style="margin-top: 0; font-size: 16px; color: #333;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="color: #666; line-height: 1.6;">
            Great news! Your payment of <strong style="color: #667eea;">${amountFormatted}</strong> has been verified and approved by our admin team.
          </p>

          <p style="color: #666; line-height: 1.6;">
            Your team registration <strong>${teamName}</strong> is now <strong style="color: #28a745;">CONFIRMED</strong>. 🎊
          </p>

          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #667eea;">🔗 Join the Hackathon WhatsApp Group</h3>
            <p style="color: #666; margin: 10px 0;">
              You can now access the exclusive WhatsApp group where we'll share updates, discussions, and last-minute announcements.
            </p>
            <a href="${whatsappLink}" style="display: inline-block; background: #25d366; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 10px 0; font-size: 16px;">
              👥 Join WhatsApp Group
            </a>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>📝 Tip:</strong> Share the WhatsApp group link with your teammates. You'll need to invite them individually.
            </p>
          </div>

          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you have any questions, please reply to this email or contact our support team.
          </p>

          <p style="color: #666; margin-top: 20px;">
            See you at the hackathon! 🚀
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            IEEE RAS Hackathon
          </p>
        </div>
      </div>
    `
  });
}

export async function sendPaymentRejectionEmail({ to, name, teamName, reason }) {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "⚠️ Payment Verification Failed - Action Required",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 8px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">❌ Payment Verification Failed</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Action required from your side</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
          <p style="margin-top: 0; font-size: 16px; color: #333;">
            Hello <strong>${name}</strong>,
          </p>

          <p style="color: #666; line-height: 1.6;">
            Unfortunately, your payment verification for team <strong>${teamName}</strong> has been rejected.
          </p>

          ${reason ? `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Reason:</strong> ${reason}
              </p>
            </div>
          ` : ''}

          <p style="color: #666; line-height: 1.6; margin-top: 20px;">
            <strong>What you can do:</strong>
          </p>
          <ul style="color: #666; line-height: 1.8;">
            <li>Review the rejection reason above</li>
            <li>Submit a new payment proof if needed</li>
            <li>Contact our support team for assistance</li>
          </ul>

          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you believe this is an error, please reply to this email with more details.
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            IEEE RAS Hackathon
          </p>
        </div>
      </div>
    `
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

/**
 * Send admin alert when a manual payment proof is added for verification
 */
export async function sendPaymentProofAlertEmail({
  orderId,
  amount,
  currency = "INR",
  participantName,
  participantEmail,
  teamName,
  proofFile,
  utrNumber,
  transactionId,
  timestamp
}) {
  const recipients = getAlertRecipients();
  const amountFormatted = typeof amount === "number" ? `₹${amount.toFixed(2)}` : `₹${amount}`;
  const timeFormatted = timestamp ? new Date(timestamp).toLocaleString("en-IN") : new Date().toLocaleString("en-IN");

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: recipients.join(","),
    subject: `💳 Payment Verification Alert - ₹${amount} Payment Proof Submitted`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">💳 Payment Proof Submitted</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">New transaction added to Payment Verification - Review Required</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #667eea;">Transaction Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold; color: #333;">Amount:</td>
                <td style="padding: 10px 0; text-align: right; color: #28a745; font-weight: bold; font-size: 16px;">${amountFormatted}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold; color: #333;">Submitted:</td>
                <td style="padding: 10px 0; text-align: right; color: #666;">${timeFormatted}</td>
              </tr>
              ${orderId ? `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold; color: #333;">Order ID:</td>
                <td style="padding: 10px 0; text-align: right; color: #666; font-family: monospace; font-size: 12px;">${orderId}</td>
              </tr>
              ` : ""}
            </table>
          </div>

          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #667eea;">Participant Information</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold; color: #333;">Name:</td>
                <td style="padding: 10px 0; text-align: right; color: #666;">${participantName || "N/A"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold; color: #333;">Email:</td>
                <td style="padding: 10px 0; text-align: right; color: #666;">${participantEmail || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold; color: #333;">Team:</td>
                <td style="padding: 10px 0; text-align: right; color: #666;">${teamName || "N/A"}</td>
              </tr>
            </table>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <h4 style="margin-top: 0; color: #333;">Bank Transfer Details:</h4>
            <p style="margin: 5px 0; color: #666;"><strong>UTR Number:</strong> ${utrNumber || "N/A"}</p>
            ${transactionId ? `<p style="margin: 5px 0; color: #666;"><strong>Transaction ID:</strong> ${transactionId}</p>` : ""}
            ${proofFile ? `<p style="margin: 5px 0; color: #666;"><strong>Proof File:</strong> <a href="${proofFile}" style="color: #667eea; text-decoration: none;">${proofFile}</a></p>` : ""}
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Action Required:</strong> Please review this payment proof and approve or reject it in the admin Payment Verification page.
            </p>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
            <a href="${env.CLIENT_ORIGIN || "http://localhost:5173"}/admin/payments" style="color: #667eea; text-decoration: none; font-weight: bold;">Go to Payment Verification →</a>
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          IEEE RAS Hackathon | Payment Verification System
        </p>
      </div>
    `
  });
}
