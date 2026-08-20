import { Router } from "express";
import { z } from "zod";
import { bulkCheckIn, checkInByParticipantId } from "../controllers/checkinController.js";
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

router.post("/scan", protect, authorize("admin"), validate(schema), checkInByParticipantId);
router.post("/bulk-scan", protect, authorize("admin"), validate(bulkSchema), bulkCheckIn);

export default router;
