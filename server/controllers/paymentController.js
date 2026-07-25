import { Payment } from "../models/Payment.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { sendRegistrationEmail } from "../services/emailService.js";
import { logPaymentAudit } from "../services/paymentAuditService.js";
import { generateQrDataUrl } from "../services/qrService.js";
import { verifyPaymentSignature } from "../services/razorpayService.js";
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
 * POST /payments/verify
 * Client sends Razorpay payment details for backend verification.
 * Razorpay popup returns: razorpay_order_id, razorpay_payment_id, razorpay_signature
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError("Missing payment details", 400);
  }

  // Verify signature with Razorpay secret
  verifyPaymentSignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  });

  const result = await markPaymentSuccess({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    source: "client"
  });

  if (result.statusCode >= 400) {
    throw new AppError(result.payload.message, result.statusCode);
  }

  res.json(result.payload);
});
