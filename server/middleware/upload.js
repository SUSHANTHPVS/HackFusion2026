import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determine upload directory - use UPLOADS_DIR env var if set, otherwise use project relative path
// On Render with disk mounted at /var/www/uploads, this will automatically work
const uploadDir = process.env.UPLOADS_DIR 
  ? path.join(process.env.UPLOADS_DIR, "payment-proofs")
  : path.join(__dirname, "../../uploads/payment-proofs");

console.log(`[Upload Middleware] Upload directory: ${uploadDir}`);
console.log(`[Upload Middleware] __dirname: ${__dirname}`);
console.log(`[Upload Middleware] Checking if directory exists...`);

// Create uploads directory if it doesn't exist
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`[Upload Middleware] ✓ Created upload directory: ${uploadDir}`);
  } else {
    console.log(`[Upload Middleware] ✓ Upload directory exists: ${uploadDir}`);
  }
} catch (error) {
  console.error(`[Upload Middleware] ✗ Error creating directory:`, error.message);
}

// Configure disk storage for payment proofs
const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`[Upload Middleware] Saving file to: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: paymentproof_<timestamp>_<random>.<ext>
    const ext = path.extname(file.originalname);
    const uniqueName = `paymentproof_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    console.log(`[Upload Middleware] Generated filename: ${uniqueName}`);
    cb(null, uniqueName);
  }
});

// File filter for payment proofs (only images)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed for payment proofs"), false);
  }
};

export const upload = multer({
  storage: paymentProofStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
