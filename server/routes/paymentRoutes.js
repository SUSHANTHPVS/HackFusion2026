import { Router } from "express";
import { z } from "zod";
import { handleRazorpayWebhook, verifyPayment } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const schema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1)
});

router.post("/webhook", handleRazorpayWebhook);
router.post("/verify", protect, authorize("participant"), validate(schema), verifyPayment);

export default router;
