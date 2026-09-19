import { Router } from "express";
import { z } from "zod";
import { createCheckoutOrder, verifyPayment, handleRazorpayWebhook, submitManualPaymentProof } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";

const router = Router();

const createOrderSchema = z.object({
	amount: z.coerce.number().int().min(100),
	currency: z.string().trim().min(1).default("INR"),
	receipt: z.string().trim().min(1).max(40)
});

const submitPaymentProofSchema = z.object({
	teamId: z.string().trim().min(1),
	utrNumber: z.string().trim().min(1, "UTR Number is required"),
	transactionId: z.string().trim().optional()
});

router.post("/webhook", handleRazorpayWebhook);

router.post("/create-order", protect, authorize("participant"), validate(createOrderSchema), createCheckoutOrder);

// Client sends Razorpay payment details for verification (authenticated)
router.post("/verify-payment", protect, authorize("participant"), verifyPayment);
router.post("/verify", protect, authorize("participant"), verifyPayment);

// Manual payment proof submission
router.post("/submit-proof", protect, authorize("participant"), upload.single("paymentProof"), validate(submitPaymentProofSchema), submitManualPaymentProof);

export default router;
