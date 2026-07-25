import { Router } from "express";
import { z } from "zod";
import { createCheckoutOrder, verifyPayment } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const createOrderSchema = z.object({
	amount: z.coerce.number().int().min(100),
	currency: z.string().trim().min(1).default("INR"),
	receipt: z.string().trim().min(1)
});

router.post("/create-order", protect, authorize("participant"), validate(createOrderSchema), createCheckoutOrder);

// Client sends Razorpay payment details for verification (authenticated)
router.post("/verify-payment", protect, authorize("participant"), verifyPayment);
router.post("/verify", protect, authorize("participant"), verifyPayment);

export default router;
