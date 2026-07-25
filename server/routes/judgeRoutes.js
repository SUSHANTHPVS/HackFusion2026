import { Router } from "express";
import { z } from "zod";
import { assignedTeams, leaderboard, submitScore } from "../controllers/judgeController.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const scoreSchema = z.object({
  teamId: z.string().min(1),
  innovation: z.number().min(0).max(10),
  technical: z.number().min(0).max(10),
  ui: z.number().min(0).max(10),
  presentation: z.number().min(0).max(10),
  theme: z.number().min(0).max(10)
});

router.get("/teams", protect, authorize("judge"), assignedTeams);
router.post("/scores", protect, authorize("judge"), validate(scoreSchema), submitScore);
router.get("/leaderboard", leaderboard);

export default router;
