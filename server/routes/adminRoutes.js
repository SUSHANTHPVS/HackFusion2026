import { Router } from "express";
import { z } from "zod";
import {
  createRecoveryOrder,
  dashboardStats,
  generateWinnerCertificate,
  listPaymentRecoveryQueue,
  searchRegistrations,
  paymentAuditTrail,
  registrationsTimeline
} from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const winnerSchema = z.object({
  winnerName: z.string().min(2),
  teamName: z.string().min(2)
});

router.get("/stats", protect, authorize("admin"), dashboardStats);
router.get("/timeline", protect, authorize("admin"), registrationsTimeline);
router.get("/registrations/search", protect, authorize("admin"), searchRegistrations);
router.get("/payments/recovery-queue", protect, authorize("admin"), listPaymentRecoveryQueue);
router.get("/payments/:orderId/audit", protect, authorize("admin"), paymentAuditTrail);
router.post("/payments/:paymentId/recovery-order", protect, authorize("admin"), createRecoveryOrder);
router.post("/certificates/winner", protect, authorize("admin"), validate(winnerSchema), generateWinnerCertificate);

export default router;
