import { Router } from "express";
import { z } from "zod";
import { verifyPayment, handleRazorpayWebhook, submitManualPaymentProof } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";

const router = Router();

const submitPaymentProofSchema = z.object({
	teamId: z.string().trim().min(1),
	utrNumber: z.string().trim().min(1, "UTR Number is required"),
	transactionId: z.string().trim().optional()
});

// Razorpay webhook (for existing payments)
router.post("/webhook", handleRazorpayWebhook);

// Razorpay payment verification (for existing payments only)
router.post("/verify-payment", protect, authorize("participant"), verifyPayment);
router.post("/verify", protect, authorize("participant"), verifyPayment);

// Manual payment proof submission
router.post("/submit-proof", protect, authorize("participant"), upload.single("paymentProof"), validate(submitPaymentProofSchema), submitManualPaymentProof);

export default router;
