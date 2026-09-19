import { Router } from "express";
import { z } from "zod";
import {
  dashboardStats,
  deleteTeam,
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
  diagnosisTeamsWithPayments,
  verifyManualPayment,
  getWhatsAppGroupLink,
  getParticipantsForWhatsApp,
  sendWhatsAppToParticipants,
  checkWhatsAppBusinessCredentials,
  sendWhatsAppGroupLinkManual,
  getParticipantsForEmail,
  sendRegistrationEmails
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
  registrationClosed: z.boolean().optional()
});

const verifyManualPaymentSchema = z.object({
  verificationStatus: z.enum(["approved", "rejected"]),
  adminNotes: z.string().optional()
});

router.get("/stats", protect, authorize("admin"), dashboardStats);
router.get("/timeline", protect, authorize("admin"), registrationsTimeline);
router.get("/registrations/search", protect, authorize("admin"), searchRegistrations);
router.delete("/teams/:teamId", protect, authorize("admin"), deleteTeam);
router.get("/payments/verification-status", protect, authorize("admin"), getPaymentVerificationStatus);
router.get("/diagnosis/teams-with-payments", protect, authorize("admin"), diagnosisTeamsWithPayments);
router.patch("/payments/:paymentId/verify", protect, authorize("admin"), validate(verifyManualPaymentSchema), verifyManualPayment);
router.get("/judges", protect, authorize("admin"), listJudges);
router.post("/judges", protect, authorize("admin"), validate(upsertJudgeSchema), upsertJudge);
router.get("/settings", protect, authorize("admin"), getAdminSettings);
router.get("/settings/history", protect, authorize("admin"), getAdminSettingsHistory);
router.patch("/settings", protect, authorize("admin"), validate(updateSettingsSchema), updateAdminSettings);
router.post("/settings/reset", protect, authorize("admin"), resetAdminSettings);
router.get("/payments/recovery-queue", protect, authorize("admin"), listPaymentRecoveryQueue);
router.get("/payments/webhooks", protect, authorize("admin"), recentWebhookEvents);
router.get("/payments/:orderId/audit", protect, authorize("admin"), paymentAuditTrail);
router.post("/certificates/winner", protect, authorize("admin"), validate(winnerSchema), generateWinnerCertificate);
router.get("/whatsapp/group-link", protect, authorize("admin"), getWhatsAppGroupLink);
// WhatsApp Business API routes
router.get("/whatsapp/participants", protect, authorize("admin"), getParticipantsForWhatsApp);
router.post("/whatsapp/send", protect, authorize("admin"), sendWhatsAppToParticipants);
router.post("/whatsapp/send-link-manual", protect, authorize("admin"), sendWhatsAppGroupLinkManual);
router.get("/whatsapp/check-credentials", protect, authorize("admin"), checkWhatsAppBusinessCredentials);

// Email routes
router.get("/email/participants", protect, authorize("admin"), getParticipantsForEmail);
router.post("/email/send-registration", protect, authorize("admin"), sendRegistrationEmails);

export default router;
