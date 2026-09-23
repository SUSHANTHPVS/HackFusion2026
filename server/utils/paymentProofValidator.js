import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Payment Proof Validator - Extract and validate payment proofs from Render disk
 * 
 * This utility:
 * 1. Maps public URLs to actual file paths
 * 2. Verifies files exist on the render disk
 * 3. Retrieves file metadata (size, modified date, etc.)
 * 4. Validates file accessibility
 */

// Determine upload directory (same logic as upload.js middleware)
let uploadRootDir;

if (process.env.RENDER_UPLOADS_DIR) {
  uploadRootDir = process.env.RENDER_UPLOADS_DIR;
  console.log(`[PaymentProofValidator] Using RENDER_UPLOADS_DIR: ${uploadRootDir}`);
} else if (process.env.UPLOADS_DIR) {
  uploadRootDir = process.env.UPLOADS_DIR;
  console.log(`[PaymentProofValidator] Using UPLOADS_DIR: ${uploadRootDir}`);
} else {
  uploadRootDir = path.join(__dirname, "../../uploads");
  console.log(`[PaymentProofValidator] Using default path: ${uploadRootDir}`);
}

const paymentProofsDir = path.join(uploadRootDir, "payment-proofs");

console.log(`[PaymentProofValidator] ============================================`);
console.log(`[PaymentProofValidator] Payment Proofs Directory: ${paymentProofsDir}`);
console.log(`[PaymentProofValidator] ============================================`);

/**
 * Get the absolute file path from a public URL
 * @param {string} publicUrl - Public URL like "/uploads/payment-proofs/filename.jpg"
 * @returns {string} Absolute file path
 */
export const getAbsoluteFilePath = (publicUrl) => {
  if (!publicUrl) return null;
  
  // Extract filename from URL
  const urlParts = publicUrl.split("/");
  const filename = urlParts[urlParts.length - 1];
  
  return path.join(paymentProofsDir, filename);
};

/**
 * Check if a payment proof file exists on disk
 * @param {string} publicUrl - Public URL like "/uploads/payment-proofs/filename.jpg"
 * @returns {boolean} True if file exists and is readable
 */
export const fileExists = (publicUrl) => {
  if (!publicUrl) return false;
  
  const filePath = getAbsoluteFilePath(publicUrl);
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`[PaymentProofValidator] Error checking file existence: ${error.message}`);
    return false;
  }
};

/**
 * Get file metadata (size, modified time, permissions, etc.)
 * @param {string} publicUrl - Public URL like "/uploads/payment-proofs/filename.jpg"
 * @returns {object} File metadata or null if file doesn't exist
 */
export const getFileMetadata = (publicUrl) => {
  if (!publicUrl) return null;
  
  const filePath = getAbsoluteFilePath(publicUrl);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[PaymentProofValidator] File not found: ${filePath}`);
      return null;
    }
    
    const stats = fs.statSync(filePath);
    
    return {
      exists: true,
      path: filePath,
      publicUrl: publicUrl,
      filename: path.basename(filePath),
      size: stats.size, // File size in bytes
      sizeKB: Math.round(stats.size / 1024), // File size in KB
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2), // File size in MB
      createdAt: stats.birthtime, // File creation time
      modifiedAt: stats.mtime, // Last modification time
      isReadable: isFileReadable(filePath),
      isFile: stats.isFile(),
      extension: path.extname(filePath),
      mimeType: getMimeType(filePath)
    };
  } catch (error) {
    console.error(`[PaymentProofValidator] Error getting file metadata: ${error.message}`);
    return null;
  }
};

/**
 * Check if a file is readable
 * @param {string} filePath - Absolute file path
 * @returns {boolean} True if file is readable
 */
const isFileReadable = (filePath) => {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get MIME type based on file extension
 * @param {string} filePath - Absolute file path
 * @returns {string} MIME type
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp"
  };
  return mimeTypes[ext] || "application/octet-stream";
};

/**
 * Validate a payment proof file
 * Checks:
 * 1. File exists on disk
 * 2. File is readable
 * 3. File size is reasonable (> 0 bytes and < 50MB)
 * 4. File is an image
 * 
 * @param {string} publicUrl - Public URL like "/uploads/payment-proofs/filename.jpg"
 * @returns {object} Validation result with status and details
 */
export const validatePaymentProof = (publicUrl) => {
  const result = {
    isValid: false,
    url: publicUrl,
    errors: [],
    metadata: null
  };
  
  if (!publicUrl) {
    result.errors.push("Payment proof URL is missing");
    return result;
  }
  
  // Check if file exists
  if (!fileExists(publicUrl)) {
    result.errors.push(`File not found on disk: ${publicUrl}`);
    return result;
  }
  
  // Get file metadata
  const metadata = getFileMetadata(publicUrl);
  if (!metadata) {
    result.errors.push("Unable to retrieve file metadata");
    return result;
  }
  
  result.metadata = metadata;
  
  // Check if file is readable
  if (!metadata.isReadable) {
    result.errors.push("File exists but is not readable (permission denied)");
    return result;
  }
  
  // Check if it's actually a file (not a directory)
  if (!metadata.isFile) {
    result.errors.push("Path exists but is not a file");
    return result;
  }
  
  // Check file size (should be > 0 and < 50MB)
  if (metadata.size === 0) {
    result.errors.push("File is empty (0 bytes)");
    return result;
  }
  
  if (metadata.size > 50 * 1024 * 1024) {
    result.errors.push(`File is too large (${metadata.sizeMB}MB, max 50MB)`);
    return result;
  }
  
  // Check if it's an image
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  if (!imageExtensions.includes(metadata.extension.toLowerCase())) {
    result.errors.push(`File is not an image: ${metadata.extension}`);
    return result;
  }
  
  // All checks passed
  result.isValid = true;
  return result;
};

/**
 * Validate multiple payment proofs
 * @param {array} publicUrls - Array of public URLs
 * @returns {object} Validation summary
 */
export const validateMultiplePaymentProofs = (publicUrls) => {
  if (!Array.isArray(publicUrls)) return null;
  
  const validations = publicUrls
    .filter(url => url) // Filter out null/undefined
    .map(url => ({
      url,
      validation: validatePaymentProof(url)
    }));
  
  return {
    total: validations.length,
    valid: validations.filter(v => v.validation.isValid).length,
    invalid: validations.filter(v => !v.validation.isValid).length,
    details: validations
  };
};

/**
 * Get all payment proof files from the disk
 * Useful for scanning what files exist
 * 
 * @returns {array} Array of file information
 */
export const getAllPaymentProofFiles = () => {
  try {
    if (!fs.existsSync(paymentProofsDir)) {
      console.warn(`[PaymentProofValidator] Directory does not exist: ${paymentProofsDir}`);
      return [];
    }
    
    const files = fs.readdirSync(paymentProofsDir);
    
    return files.map(filename => {
      const filePath = path.join(paymentProofsDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        path: filePath,
        publicUrl: `/uploads/payment-proofs/${filename}`,
        size: stats.size,
        sizeKB: Math.round(stats.size / 1024),
        modifiedAt: stats.mtime
      };
    });
  } catch (error) {
    console.error(`[PaymentProofValidator] Error reading payment proofs directory: ${error.message}`);
    return [];
  }
};

/**
 * Get directory info
 * @returns {object} Directory information
 */
export const getDirectoryInfo = () => {
  try {
    const exists = fs.existsSync(paymentProofsDir);
    
    if (!exists) {
      return {
        exists: false,
        path: paymentProofsDir,
        isWritable: false,
        fileCount: 0
      };
    }
    
    // Check if directory is writable
    let isWritable = false;
    const testFile = path.join(paymentProofsDir, ".write_test");
    try {
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
      isWritable = true;
    } catch (err) {
      isWritable = false;
    }
    
    // Count files
    const files = fs.readdirSync(paymentProofsDir);
    const totalSize = files.reduce((sum, file) => {
      const filePath = path.join(paymentProofsDir, file);
      const stats = fs.statSync(filePath);
      return sum + stats.size;
    }, 0);
    
    return {
      exists: true,
      path: paymentProofsDir,
      isWritable,
      fileCount: files.length,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      files: files
    };
  } catch (error) {
    console.error(`[PaymentProofValidator] Error getting directory info: ${error.message}`);
    return {
      exists: false,
      path: paymentProofsDir,
      error: error.message
    };
  }
};

export default {
  getAbsoluteFilePath,
  fileExists,
  getFileMetadata,
  validatePaymentProof,
  validateMultiplePaymentProofs,
  getAllPaymentProofFiles,
  getDirectoryInfo
};
