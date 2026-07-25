import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_ORIGIN: z.string().url(),
  CLIENT_ORIGINS: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(1),
  INDIVIDUAL_FEE_INR: z.coerce.number().default(50),
  TEAM_FEE_INR: z.coerce.number().default(200),
  REGISTRATION_CLOSED: z.coerce.boolean().default(false),
  PHONEPE_MERCHANT_ID: z.string().min(1),
  PHONEPE_SALT_KEY: z.string().min(1),
  PHONEPE_SALT_INDEX: z.coerce.number().int().min(1).default(1),
  SERVER_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_FORM_WEBHOOK_URL: z.string().url().optional(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1)
});

export const env = schema.parse(process.env);
