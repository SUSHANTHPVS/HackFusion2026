import { Router } from "express";
import { handlePhonePeCallback, getPaymentStatus } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// Server-to-server callback from PhonePe (no auth — verified by X-VERIFY signature)
router.post("/callback", handlePhonePeCallback);

// Client polls this after PhonePe redirect to check / confirm payment status
router.get("/status/:transactionId", protect, authorize("participant"), getPaymentStatus);

export default router;
