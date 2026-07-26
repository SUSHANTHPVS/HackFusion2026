import { Router } from "express";
import { z } from "zod";
import { adminLogin, googleAuth, login, me, register } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().min(2),
  ieeeMember: z.boolean().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const adminLoginSchema = z.object({
  adminId: z.string().email(),
  password: z.string().min(8)
});

const googleAuthSchema = z.object({
  idToken: z.string().min(20),
  clientId: z.string().min(20).optional(),
  gender: z.enum(["male", "female"]).optional(),
  department: z.string().min(2).optional(),
  ieeeMember: z.boolean().optional()
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/admin-login", validate(adminLoginSchema), adminLogin);
router.post("/google", validate(googleAuthSchema), googleAuth);
router.get("/me", protect, me);

export default router;
