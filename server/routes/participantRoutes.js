import { Router } from "express";
import {
  listExploreTeams,
  myDashboard,
  submitProject,
  updateProfile
} from "../controllers/participantController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

const submissionSchema = z.object({
  projectTitle: z.string().min(3),
  repoUrl: z.string().url(),
  demoUrl: z.string().url().optional(),
  pptUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional()
});

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z
    .string()
    .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female"]),
  profilePicture: z.string().max(1500000).optional().or(z.literal(""))
});

router.get("/dashboard", protect, authorize("participant"), myDashboard);
router.put("/profile", protect, authorize("participant"), validate(profileSchema), updateProfile);
router.get("/explore-teams", protect, authorize("participant"), listExploreTeams);
router.post("/submission", protect, authorize("participant"), validate(submissionSchema), submitProject);

export default router;
