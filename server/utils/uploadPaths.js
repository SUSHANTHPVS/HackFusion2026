import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getUploadsDir() {
  return process.env.RENDER_UPLOADS_DIR || process.env.UPLOADS_DIR || path.join(__dirname, "../../uploads");
}

export function getPaymentProofsDir() {
  return path.join(getUploadsDir(), "payment-proofs");
}