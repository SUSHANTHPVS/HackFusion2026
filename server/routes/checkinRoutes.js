import { Router } from "express";
import { z } from "zod";
import { bulkCheckIn, checkInByParticipantId, teamBulkCheckIn } from "../controllers/checkinController.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const schema = z.object({
  participantId: z.string().min(1),
  checkedIn: z.boolean().optional()
});

const bulkSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1),
  checkedIn: z.boolean().optional()
});

const teamBulkSchema = z.object({
  teamId: z.string().min(1),
  memberKeys: z.array(z.string().min(1)).min(1),
  checkedIn: z.boolean().optional()
});

router.post("/scan", protect, authorize("admin"), validate(schema), checkInByParticipantId);
router.post("/bulk-scan", protect, authorize("admin"), validate(bulkSchema), bulkCheckIn);
router.post("/team-bulk-scan", protect, authorize("admin"), validate(teamBulkSchema), teamBulkCheckIn);

export default router;
