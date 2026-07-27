import { Router } from "express";
import { z } from "zod";
import {
  createRecoveryOrder,
  dashboardStats,
  generateWinnerCertificate,
  getAdminSettings,
  getAdminSettingsHistory,
  listPaymentRecoveryQueue,
  listJudges,
  recentWebhookEvents,
  resetAdminSettings,
  searchRegistrations,
  upsertJudge,
  updateAdminSettings,
  paymentAuditTrail,
  registrationsTimeline,
  getPaymentVerificationStatus,
  diagnosisTeamsWithPayments
} from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const winnerSchema = z.object({
  winnerName: z.string().min(2),
  teamName: z.string().min(2)
});

const upsertJudgeSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).optional(),
  department: z.string().min(2).optional(),
  password: z.string().min(8).optional()
});

const updateSettingsSchema = z.object({
  registrationClosed: z.boolean().optional(),
  individualFeeInr: z.number().min(0).optional(),
  teamFeeInr: z.number().min(0).optional()
});

router.get("/stats", protect, authorize("admin"), dashboardStats);
router.get("/timeline", protect, authorize("admin"), registrationsTimeline);
router.get("/registrations/search", protect, authorize("admin"), searchRegistrations);
router.get("/payments/verification-status", protect, authorize("admin"), getPaymentVerificationStatus);
router.get("/diagnosis/teams-with-payments", protect, authorize("admin"), diagnosisTeamsWithPayments);
router.get("/judges", protect, authorize("admin"), listJudges);
router.post("/judges", protect, authorize("admin"), validate(upsertJudgeSchema), upsertJudge);
router.get("/settings", protect, authorize("admin"), getAdminSettings);
router.get("/settings/history", protect, authorize("admin"), getAdminSettingsHistory);
router.patch("/settings", protect, authorize("admin"), validate(updateSettingsSchema), updateAdminSettings);
router.post("/settings/reset", protect, authorize("admin"), resetAdminSettings);
router.get("/payments/recovery-queue", protect, authorize("admin"), listPaymentRecoveryQueue);
router.get("/payments/webhooks", protect, authorize("admin"), recentWebhookEvents);
router.get("/payments/:orderId/audit", protect, authorize("admin"), paymentAuditTrail);
router.post("/payments/:paymentId/recovery-order", protect, authorize("admin"), createRecoveryOrder);
router.post("/certificates/winner", protect, authorize("admin"), validate(winnerSchema), generateWinnerCertificate);

export default router;
