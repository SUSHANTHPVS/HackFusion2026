import { Payment } from "../models/Payment.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { sendRegistrationEmail } from "../services/emailService.js";
import { logPaymentAudit } from "../services/paymentAuditService.js";
import { generateQrDataUrl } from "../services/qrService.js";
import { checkPaymentStatus, verifyPhonePeCallback } from "../services/phonePeService.js";
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

/**
 * GET /payments/status/:transactionId
 * Called by the client after PhonePe redirects back. Checks payment status from
 * PhonePe and updates the local record if it has succeeded.
 */
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  const payment = await Payment.findOne({ orderId: transactionId });
  if (!payment) throw new AppError("Payment record not found", 404);

  if (String(payment.userId) !== String(req.user._id)) {
    throw new AppError("You are not allowed to check this payment.", 403);
  }

  // Return cached status if already finalised.
  if (payment.status === "success" || payment.status === "failed") {
    return res.json({ paymentStatus: payment.status, message: `Payment ${payment.status}.` });
  }

  await logPaymentAudit({
    paymentRef: payment._id,
    orderId: transactionId,
    userId: payment.userId,
    teamId: payment.teamId,
    eventType: "VERIFY_ATTEMPT",
    source: "client",
    status: "info",
    message: "Client polling PhonePe status",
    payload: {}
  });

  const phonePeResponse = await checkPaymentStatus(transactionId);
  const code = phonePeResponse?.code;

  if (phonePeResponse?.success && code === "PAYMENT_SUCCESS") {
    const phonePePaymentId =
      phonePeResponse?.data?.paymentInstrument?.pgTransactionId || transactionId;
    const result = await markPaymentSuccess({
      orderId: transactionId,
      paymentId: phonePePaymentId,
      signature: code,
      source: "client"
    });
    if (result.statusCode >= 400) throw new AppError(result.payload.message, result.statusCode);
    return res.json(result.payload);
  }

  if (code === "PAYMENT_ERROR" || code === "PAYMENT_DECLINED" || code === "TIMED_OUT") {
    payment.status = "failed";
    await payment.save();

    await logPaymentAudit({
      paymentRef: payment._id,
      orderId: transactionId,
      userId: payment.userId,
      teamId: payment.teamId,
      eventType: "VERIFY_FAILED",
      source: "client",
      status: "failed",
      message: `PhonePe status: ${code}`,
      payload: { code }
    });

    return res.json({ paymentStatus: "failed", message: "Payment failed or was declined." });
  }

  // PAYMENT_PENDING or other intermediate states
  res.json({ paymentStatus: "pending", message: "Payment is still being processed." });
});

/**
 * POST /payments/callback
 * Server-to-server callback from PhonePe after payment is completed.
 */
export const handlePhonePeCallback = asyncHandler(async (req, res) => {
  const xVerifyHeader = req.headers["x-verify"];
  const body = req.body;

  const responseBase64 = body?.response;
  if (!responseBase64) {
    throw new AppError("Invalid callback payload", 400);
  }

  const isValid = verifyPhonePeCallback(responseBase64, xVerifyHeader);
  if (!isValid) {
    throw new AppError("Invalid callback signature", 400);
  }

  let event;
  try {
    event = JSON.parse(Buffer.from(responseBase64, "base64").toString("utf8"));
  } catch {
    throw new AppError("Malformed callback payload", 400);
  }

  const code = event?.code;
  const transactionId = event?.data?.merchantTransactionId;
  const phonePePaymentId =
    event?.data?.transactionId || event?.data?.paymentInstrument?.pgTransactionId;

  await logPaymentAudit({
    orderId: transactionId || "unknown",
    eventType: "WEBHOOK_RECEIVED",
    source: "webhook",
    status: "info",
    message: `PhonePe callback received: ${code}`,
    payload: { code, transactionId }
  });

  if (code === "PAYMENT_SUCCESS" && transactionId) {
    await markPaymentSuccess({
      orderId: transactionId,
      paymentId: phonePePaymentId || transactionId,
      signature: code,
      source: "webhook"
    });

    await logPaymentAudit({
      orderId: transactionId,
      eventType: "WEBHOOK_CAPTURED",
      source: "webhook",
      status: "success",
      message: "PhonePe payment reconciled by callback",
      payload: { phonePePaymentId }
    });
  }

  if ((code === "PAYMENT_ERROR" || code === "PAYMENT_DECLINED") && transactionId) {
    await Payment.findOneAndUpdate(
      { orderId: transactionId, status: { $ne: "success" } },
      { status: "failed", paymentId: phonePePaymentId || undefined }
    );

    await logPaymentAudit({
      orderId: transactionId,
      eventType: "WEBHOOK_FAILED",
      source: "webhook",
      status: "info",
      message: `PhonePe payment failed via callback: ${code}`,
      payload: { phonePePaymentId }
    });
  }

  res.status(200).json({ received: true });
});
