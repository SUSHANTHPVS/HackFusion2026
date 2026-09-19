import fs from "fs";
import path from "path";
import { Payment } from "../models/Payment.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { countSuccessfulRegisteredParticipants, countTeamParticipantSlots } from "../services/registrationCapacityService.js";
import { sendPaymentDisputeAlertEmail, sendRegistrationEmail } from "../services/emailService.js";
import { logPaymentAudit } from "../services/paymentAuditService.js";
import { env } from "../config/env.js";
import { generateQrDataUrl } from "../services/qrService.js";
import { verifyPaymentSignature, verifyWebhookSignature } from "../services/razorpayService.js";
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

  const team = await Team.findById(payment.teamId).lean();
  const teamSlots = countTeamParticipantSlots(team || { teammates: [] });
  const successfulParticipants = await countSuccessfulRegisteredParticipants();

  if (successfulParticipants + teamSlots > Number(env.REGISTRATION_CAPACITY || 125)) {
    await logPaymentAudit({
      paymentRef: payment._id,
      orderId,
      userId: payment.userId,
      teamId: payment.teamId,
      eventType: "VERIFY_FAILED",
      source,
      status: "failed",
      message: "Registration capacity reached before payment could be confirmed",
      payload: { paymentId, teamSlots, successfulParticipants }
    });

    return {
      statusCode: 403,
      payload: { message: "Registrations are full. Please contact the organizers." }
    };
  }

  // ALWAYS set paymentId and signature if provided
  payment.paymentId = paymentId;
  payment.signature = signature || paymentId; // Ensure signature is always set
  payment.status = "success";
  
  console.log(`[markPaymentSuccess] Saving payment - orderId: ${orderId}, paymentId: ${paymentId}, signature: ${signature ? "✅ Present" : "❌ Missing"}`);
  await payment.save();
  console.log(`[markPaymentSuccess] Payment saved successfully - signature in DB: ${payment.signature ? "✅ Present" : "❌ Missing"}`);

  const user = await User.findById(payment.userId);
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

  // Send registration confirmation email (non-blocking - fire and forget)
  sendRegistrationEmail({ to: user.email, name: user.name, teamName: team.name })
    .catch((emailError) => {
      console.error("[markPaymentSuccess] Failed to send registration confirmation email:", emailError.message);
      // Don't throw error - email failure should not fail payment verification
    });

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
    throw new AppError("Missing payment details (order_id, payment_id, signature)", 400);
  }

  // Verify signature with Razorpay secret - will throw if invalid
  verifyPaymentSignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  });

  console.log(`[verifyPayment] Verified signature for order: ${razorpay_order_id}, payment: ${razorpay_payment_id}`);

  const result = await markPaymentSuccess({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    source: "client"
  });

  if (result.statusCode >= 400) {
    console.error(`[verifyPayment] Failed to mark payment success:`, result.payload);
    throw new AppError(result.payload.message, result.statusCode);
  }

  console.log(`[verifyPayment] Payment marked success for order: ${razorpay_order_id}`);
  res.json(result.payload);
});

/**
 * POST /payments/webhook
 * Razorpay webhook handler (server-to-server).
 */
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const payloadBuffer = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body || {}), "utf8");

  verifyWebhookSignature(payloadBuffer, signature);

  const payloadText = payloadBuffer.toString("utf8");
  const event = JSON.parse(payloadText || "{}");
  const eventType = String(event?.event || "");
  const paymentEntity = event?.payload?.payment?.entity;
  const orderEntity = event?.payload?.order?.entity;
  const refundEntity = event?.payload?.refund?.entity;
  const disputeEntity = event?.payload?.dispute?.entity;
  const orderId = paymentEntity?.order_id || orderEntity?.id;
  const paymentId = paymentEntity?.id || refundEntity?.payment_id || disputeEntity?.payment_id;

  if (orderId) {
    await logPaymentAudit({
      orderId,
      eventType: "WEBHOOK_RECEIVED",
      source: "webhook",
      status: "info",
      message: `Webhook received: ${eventType || "unknown"}`,
      payload: {
        eventType,
        paymentId,
        rawStatus: paymentEntity?.status
      }
    });
  }

  if ((eventType === "payment.captured" || eventType === "order.paid") && orderId && paymentId) {
    const result = await markPaymentSuccess({
      orderId,
      paymentId,
      source: "webhook"
    });

    await logPaymentAudit({
      orderId,
      eventType: "WEBHOOK_CAPTURED",
      source: "webhook",
      status: result.statusCode >= 400 ? "failed" : "success",
      message: result.payload?.message || "Webhook capture processed",
      payload: { paymentId, eventType }
    });

    return res.status(200).json({ received: true });
  }

  if (eventType === "payment.failed" && orderId) {
    const payment = await Payment.findOne({ orderId });

    if (payment && payment.status !== "success") {
      payment.status = "failed";
      if (paymentId) {
        payment.paymentId = paymentId;
      }
      await payment.save();
    }

    await logPaymentAudit({
      paymentRef: payment?._id,
      orderId,
      userId: payment?.userId,
      teamId: payment?.teamId,
      eventType: "WEBHOOK_FAILED",
      source: "webhook",
      status: "failed",
      message: "Webhook reported payment failure",
      payload: {
        paymentId,
        reason: paymentEntity?.error_description || paymentEntity?.error_reason || "unknown"
      }
    });
  }

  if (eventType.startsWith("refund.")) {
    const payment = paymentId ? await Payment.findOne({ paymentId }) : null;
    const auditOrderId = orderId || payment?.orderId || "unknown-order";
    const refundStatus = refundEntity?.status || "unknown";

    await logPaymentAudit({
      paymentRef: payment?._id,
      orderId: auditOrderId,
      userId: payment?.userId,
      teamId: payment?.teamId,
      eventType: "WEBHOOK_REFUND",
      source: "webhook",
      status: eventType === "refund.failed" ? "failed" : "info",
      message: `Refund webhook: ${eventType}`,
      payload: {
        eventType,
        paymentId,
        refundId: refundEntity?.id,
        refundStatus,
        amount: refundEntity?.amount,
        speedProcessed: refundEntity?.speed_processed,
        notes: refundEntity?.notes || null
      }
    });

    return res.status(200).json({ received: true });
  }

  if (eventType.startsWith("payment.dispute.")) {
    const payment = paymentId ? await Payment.findOne({ paymentId }) : null;
    const auditOrderId = orderId || payment?.orderId || "unknown-order";
    const disputeStatus = disputeEntity?.status || "unknown";

    let auditStatus = "info";
    if (eventType === "payment.dispute.lost") {
      auditStatus = "failed";
    }
    if (eventType === "payment.dispute.won") {
      auditStatus = "success";
    }

    await logPaymentAudit({
      paymentRef: payment?._id,
      orderId: auditOrderId,
      userId: payment?.userId,
      teamId: payment?.teamId,
      eventType: "WEBHOOK_DISPUTE",
      source: "webhook",
      status: auditStatus,
      message: `Dispute webhook: ${eventType}`,
      payload: {
        eventType,
        paymentId,
        disputeId: disputeEntity?.id,
        disputeStatus,
        amount: disputeEntity?.amount,
        reasonCode: disputeEntity?.reason_code || null,
        reasonDescription: disputeEntity?.reason_description || null,
        phase: disputeEntity?.phase || null
      }
    });

    if (eventType === "payment.dispute.created" || eventType === "payment.dispute.action_required") {
      const [participant, team] = await Promise.all([
        payment?.userId ? User.findById(payment.userId).select("email") : null,
        payment?.teamId ? Team.findById(payment.teamId).select("name") : null
      ]);

      void sendPaymentDisputeAlertEmail({
        eventType,
        disputeId: disputeEntity?.id,
        paymentId,
        orderId: auditOrderId,
        amount: disputeEntity?.amount,
        currency: disputeEntity?.currency || "INR",
        reasonCode: disputeEntity?.reason_code || null,
        reasonDescription: disputeEntity?.reason_description || null,
        phase: disputeEntity?.phase || null,
        disputeStatus,
        participantEmail: participant?.email || null,
        teamName: team?.name || null
      }).catch((emailError) => {
        console.error("Dispute alert email failed", emailError?.message || emailError);
      });
    }

    return res.status(200).json({ received: true });
  }

  return res.status(200).json({ received: true });
});

/**
 * POST /payments/submit-proof
 * Submit payment proof (receipt/screenshot) for manual bank transfer payment
 */
export const submitManualPaymentProof = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Payment proof file is required", 400);
  }

  const { teamId, utrNumber, transactionId } = req.body;
  if (!teamId) {
    throw new AppError("Team ID is required", 400);
  }

  // Find the payment for this user and team (can be pending_verification or failed/rejected)
  const payment = await Payment.findOne({
    userId: req.user._id,
    teamId,
    status: { $in: ["pending_verification", "failed"] }
  });

  if (!payment) {
    throw new AppError("No pending payment found for this team. Please create a team and order first.", 404);
  }

  // Store file path (in production, this would be uploaded to S3 or similar)
  const fileUrl = `/uploads/payment-proofs/${req.file.filename}`;
  
  console.log(`[submitManualPaymentProof] ============================================`);
  console.log(`[submitManualPaymentProof] File Upload Details:`);
  console.log(`[submitManualPaymentProof] ============================================`);
  console.log(`[submitManualPaymentProof] Original filename: ${req.file.originalname}`);
  console.log(`[submitManualPaymentProof] Stored filename: ${req.file.filename}`);
  console.log(`[submitManualPaymentProof] File path: ${req.file.path}`);
  console.log(`[submitManualPaymentProof] File size: ${req.file.size} bytes`);
  console.log(`[submitManualPaymentProof] MIME type: ${req.file.mimetype}`);
  console.log(`[submitManualPaymentProof] Public URL: ${fileUrl}`);
  
  // CRITICAL: Verify file was actually saved to disk
  if (!fs.existsSync(req.file.path)) {
    console.error(`[submitManualPaymentProof] ✗ CRITICAL ERROR: File NOT saved to disk!`);
    console.error(`[submitManualPaymentProof] ✗ Expected path: ${req.file.path}`);
    console.error(`[submitManualPaymentProof] ✗ This means the upload directory may not be writable`);
    throw new AppError("File upload failed - unable to save to disk. Please contact support.", 500);
  }
  
  // Verify file has content
  const fileStats = fs.statSync(req.file.path);
  if (fileStats.size === 0) {
    console.error(`[submitManualPaymentProof] ✗ File is empty (0 bytes)!`);
    throw new AppError("Uploaded file is empty. Please upload a valid image.", 400);
  }
  
  console.log(`[submitManualPaymentProof] ✓ File verified on disk`);
  console.log(`[submitManualPaymentProof] ✓ File size: ${fileStats.size} bytes`);
  console.log(`[submitManualPaymentProof] ============================================`);
  
  payment.paymentProofFile = fileUrl;
  payment.paymentProofSubmittedAt = new Date();
  payment.status = "pending_verification";  // Set to pending for admin review
  payment.rejectionReason = null;  // Clear any previous rejection reason
  
  // Store bank transfer tracking information (UTR is mandatory, Transaction ID is optional)
  payment.utrNumber = utrNumber.trim();
  if (transactionId) {
    payment.transactionId = transactionId.trim();
  }
  
  await payment.save();

  await logPaymentAudit({
    paymentRef: payment._id,
    orderId: payment.orderId,
    userId: req.user._id,
    teamId,
    eventType: "MANUAL_PROOF_SUBMITTED",
    source: "user",
    status: "info",
    message: "Manual payment proof submitted for admin verification",
    payload: {
      proofFile: fileUrl,
      filePath: req.file.path,
      fileSize: req.file.size,
      submittedAt: payment.paymentProofSubmittedAt,
      utrNumber: payment.utrNumber,
      transactionId: payment.transactionId
    }
  });

  res.status(200).json({
    message: "Payment proof submitted successfully. Please wait for admin verification.",
    payment: {
      _id: payment._id,
      status: payment.status,
      paymentProofSubmittedAt: payment.paymentProofSubmittedAt
    }
  });
});

