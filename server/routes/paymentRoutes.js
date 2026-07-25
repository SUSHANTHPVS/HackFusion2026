import { Router } from "express";
import { verifyPayment } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// Client sends Razorpay payment details for verification (authenticated)
router.post("/verify", protect, authorize("participant"), verifyPayment);

export default router;
