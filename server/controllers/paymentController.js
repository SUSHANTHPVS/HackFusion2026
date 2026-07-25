import { Payment } from "../models/Payment.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { sendRegistrationEmail } from "../services/emailService.js";
import { logPaymentAudit } from "../services/paymentAuditService.js";
import { generateQrDataUrl } from "../services/qrService.js";
import { verifyRazorpaySignature, verifyRazorpayWebhookSignature } from "../services/razorpayService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function markPaymentSuccess({ orderId, paymentId, signature, source = "system" }) {
  const payment = await Payment.findOne({ orderId });
  if (!payment) {
    await logPaymentAudit({
      orderId,
      eventType: "VERIFY_FAILED",
      source,
      status: "failed",
      message: "Payment record not found",
      payload: { paymentId }
    });
    return { statusCode: 404, payload: { message: "Payment record not found" } };
  }

  if (payment.status === "success") {
    await logPaymentAudit({
      paymentRef: payment._id,
      orderId,
      userId: payment.userId,
      teamId: payment.teamId,
      eventType: "VERIFY_SUCCESS",
      source,
      status: "info",
      message: "Payment already marked success",
      payload: { paymentId }
    });
    return { statusCode: 200, payload: { message: "Payment already verified", paymentStatus: payment.status } };
  }

  const paymentIdAlreadyUsed = await Payment.findOne({ paymentId, status: "success" });
  if (paymentIdAlreadyUsed) {
    await logPaymentAudit({
      paymentRef: payment._id,
      orderId,
      userId: payment.userId,
      teamId: payment.teamId,
      eventType: "VERIFY_FAILED",
      source,
      status: "failed",
      message: "Payment ID already linked with another transaction",
      payload: { paymentId }
    });
    return {
      statusCode: 409,
      payload: { message: "Payment ID already linked with another transaction" }
    };
  }

  payment.paymentId = paymentId;
  payment.signature = signature;
  payment.status = "success";
  await payment.save();

  const user = await User.findById(payment.userId);
  const team = await Team.findById(payment.teamId);
  if (!user || !team) {
    await logPaymentAudit({
      paymentRef: payment._id,
      orderId,
      userId: payment.userId,
      teamId: payment.teamId,
      eventType: "VERIFY_FAILED",
      source,
      status: "failed",
      message: "Payment updated but user/team record is missing",
      payload: { paymentId }
    });
    return {
      statusCode: 500,
      payload: { message: "Payment updated but user/team record is missing" }
    };
  }

  if (!user.qrCode) {
    user.qrCode = await generateQrDataUrl(`participant:${user._id}`);
    await user.save();
  }

  await sendRegistrationEmail({ to: user.email, name: user.name, teamName: team.name });

  await logPaymentAudit({
    paymentRef: payment._id,
    orderId,
    userId: payment.userId,
    teamId: payment.teamId,
    eventType: "VERIFY_SUCCESS",
    source,
    status: "success",
    message: "Payment marked successful",
    payload: { paymentId }
  });

  return {
    statusCode: 200,
    payload: { message: "Payment verified", paymentStatus: payment.status }
  };
}

export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;
  const payment = await Payment.findOne({ orderId });
  if (!payment) throw new AppError("Payment record not found", 404);

  await logPaymentAudit({
    paymentRef: payment._id,
    orderId,
    userId: payment.userId,
    teamId: payment.teamId,
    eventType: "VERIFY_ATTEMPT",
    source: "client",
    status: "info",
    message: "Participant verification attempted",
    payload: { paymentId }
  });

  if (String(payment.userId) !== String(req.user._id)) {
    await logPaymentAudit({
      paymentRef: payment._id,
      orderId,
      userId: payment.userId,
      teamId: payment.teamId,
      eventType: "VERIFY_FAILED",
      source: "client",
      status: "failed",
      message: "Payment ownership mismatch",
      payload: { actorUserId: req.user._id }
    });
    throw new AppError("You are not allowed to verify this payment.", 403);
  }

  if (payment.status === "success") {
    return res.json({ message: "Payment already verified", paymentStatus: payment.status });
  }

  const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });
  if (!isValid) {
    await logPaymentAudit({
      paymentRef: payment._id,
      orderId,
      userId: payment.userId,
      teamId: payment.teamId,
      eventType: "VERIFY_FAILED",
      source: "client",
      status: "failed",
      message: "Invalid Razorpay signature",
      payload: { paymentId }
    });
    throw new AppError("Invalid payment signature", 400);
  }

  const result = await markPaymentSuccess({ orderId, paymentId, signature, source: "client" });
  if (result.statusCode >= 400) {
    throw new AppError(result.payload.message, result.statusCode);
  }

  res.json(result.payload);
});

export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signatureHeader = req.headers["x-razorpay-signature"];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  const rawBody = req.body;

  if (!Buffer.isBuffer(rawBody)) {
    throw new AppError("Invalid webhook payload", 400);
  }

  const isValidWebhook = verifyRazorpayWebhookSignature(rawBody, signature);
  if (!isValidWebhook) {
    throw new AppError("Invalid webhook signature", 400);
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  const eventType = event.event;
  const entity = event.payload?.payment?.entity;
  const orderId = entity?.order_id;

  await logPaymentAudit({
    orderId: orderId || "unknown",
    eventType: "WEBHOOK_RECEIVED",
    source: "webhook",
    status: "info",
    message: `Webhook received: ${eventType}`,
    payload: { eventId: event?.id }
  });

  if (eventType === "payment.captured") {
    const paymentId = entity?.id;

    if (orderId && paymentId) {
      await markPaymentSuccess({
        orderId,
        paymentId,
        signature: String(signature || ""),
        source: "webhook"
      });

      await logPaymentAudit({
        orderId,
        eventType: "WEBHOOK_CAPTURED",
        source: "webhook",
        status: "success",
        message: "Captured payment reconciled by webhook",
        payload: { paymentId }
      });
    }
  }

  if (eventType === "payment.failed") {
    if (orderId) {
      await Payment.findOneAndUpdate(
        { orderId, status: { $ne: "success" } },
        {
          status: "failed",
          paymentId: entity?.id || undefined
        }
      );

      await logPaymentAudit({
        orderId,
        eventType: "WEBHOOK_FAILED",
        source: "webhook",
        status: "info",
        message: "Failed payment status updated by webhook",
        payload: { paymentId: entity?.id }
      });
    }
  }

  res.status(200).json({ received: true });
});
