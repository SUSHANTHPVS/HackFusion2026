import multer from "multer";
import path from "path";
import fs from "fs";
import { getPaymentProofsDir } from "../utils/uploadPaths.js";

// ============================================================================
// RENDER DEPLOYMENT GUIDE:
// For images to persist on Render, you MUST add a disk:
// 1. Go to Render Dashboard → Your Backend Service → Settings
// 2. Scroll to "Disks" → Click "Add Disk"
// 3. Set these EXACT values:
//    - Name: uploads
//    - Size: 1GB (or more)
//    - Mount Path: /var/www/uploads  ← IMPORTANT: Use this exact path
// 4. Click "Add Disk"
// 5. Redeploy your service
// 6. In Render Environment Variables, add (if different mount path used):
//    - Key: RENDER_UPLOADS_DIR
//    - Value: /your/mount/path
// ============================================================================

// Determine upload directory
// Priority: 1. RENDER_UPLOADS_DIR env var, 2. UPLOADS_DIR env var, 3. default path
const uploadDir = getPaymentProofsDir();
console.log(`[Upload] Using payment proof directory: ${uploadDir}`);

console.log(`[Upload] ============================================`);
console.log(`[Upload] Upload Directory Configuration`);
console.log(`[Upload] ============================================`);
console.log(`[Upload] Absolute path: ${uploadDir}`);
console.log(`[Upload] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[Upload] RENDER_UPLOADS_DIR env: ${process.env.RENDER_UPLOADS_DIR || "not set"}`);
console.log(`[Upload] UPLOADS_DIR env: ${process.env.UPLOADS_DIR || "not set"}`);

// Create uploads directory if it doesn't exist
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`[Upload] ✓ Created upload directory: ${uploadDir}`);
  } else {
    console.log(`[Upload] ✓ Upload directory exists`);
    
    // Check if we can write to it
    const testFile = path.join(uploadDir, ".test_write");
    try {
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
      console.log(`[Upload] ✓ Directory is writable`);
    } catch (err) {
      console.error(`[Upload] ✗ Directory exists but NOT writable:`, err.message);
    }
  }
} catch (error) {
  console.error(`[Upload] ✗ Error creating directory:`, error.message);
  console.error(`[Upload] ✗ This will cause file uploads to FAIL!`);
}

console.log(`[Upload] ============================================`);

// Configure disk storage for payment proofs
const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`[Upload] Processing file upload: ${file.originalname}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `paymentproof_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    console.log(`[Upload] Generated filename: ${uniqueName}`);
    cb(null, uniqueName);
  }
});

// File filter for payment proofs (only images)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    console.log(`[Upload] File type approved: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.error(`[Upload] File type rejected: ${file.mimetype}`);
    cb(new Error(`Only image files are allowed. Got: ${file.mimetype}`), false);
  }
};

export const upload = multer({
  storage: paymentProofStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
