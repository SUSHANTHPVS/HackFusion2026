import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const schema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  ADMIN_LOGIN_ID: z.string().email().optional(),
  ADMIN_LOGIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_DISPLAY_NAME: z.string().default("Admin"),
  CLIENT_ORIGIN: z.string().url(),
  CLIENT_ORIGINS: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(1),
  INDIVIDUAL_FEE_INR: z.coerce.number().default(50),
  TEAM_FEE_INR: z.coerce.number().default(200),
  REGISTRATION_CAPACITY: z.coerce.number().int().positive().default(140),
  REGISTRATION_CLOSED: z.coerce.boolean().default(false),
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_FORM_WEBHOOK_URL: z.string().url().optional(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),
  PAYMENT_ALERT_EMAILS: z.string().optional()
});

export const env = schema.parse(process.env);
