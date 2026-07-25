import { Router } from "express";
import { z } from "zod";
import { checkInByParticipantId } from "../controllers/checkinController.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const schema = z.object({
  participantId: z.string().min(1)
});

router.post("/scan", protect, authorize("admin"), validate(schema), checkInByParticipantId);

export default router;
