# Admin Payment Verification - Payment Proof Display Fix

## Problem Summary
The admin payment verification panel was unable to display payment proofs uploaded by users, even though the static file serving middleware was added. Users' uploaded payment proof images were not appearing in the admin interface.

### Root Cause Analysis
Three interconnected issues were preventing payment proofs from displaying:

#### Issue #1: File Storage Not Persisting to Disk
**Location**: `server/middleware/upload.js`
**Problem**: The multer middleware was configured with `memoryStorage()`, which stores files in RAM, not on disk. This meant:
- Files were not persisted to the filesystem
- `req.file.filename` was undefined (memory storage doesn't provide a filename)
- The file path `/uploads/payment-proofs/${req.file.filename}` was storing undefined/null values in the database
- Admin couldn't retrieve files because they were never saved to disk

**Solution**: Changed upload storage from `memoryStorage()` to `diskStorage()` with proper configuration:
```javascript
const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);  // Directory: /uploads/payment-proofs/
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `paymentproof_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, uniqueName);
  }
});
```

#### Issue #2: Incorrect Payment Status Query
**Location**: `server/controllers/paymentController.js` - `submitManualPaymentProof()` function
**Problem**: The function only looked for payments with status `"pending_verification"`:
```javascript
// OLD CODE
const payment = await Payment.findOne({
  userId: req.user._id,
  teamId,
  status: "pending_verification"  // Only this status
});
```

This prevented:
- Resubmission of proofs after rejection (status would be "failed")
- Initial submission scenarios where status might differ

**Solution**: Updated query to handle both initial submissions and resubmissions:
```javascript
// NEW CODE
const payment = await Payment.findOne({
  userId: req.user._id,
  teamId,
  status: { $in: ["pending_verification", "failed"] }  // Handle both cases
});
```

#### Issue #3: Static File Serving Path Configuration
**Location**: `server/server.js`
**Problem**: Express static middleware was using relative path:
```javascript
// OLD CODE
app.use("/uploads", express.static("uploads"));
```

This caused issues when:
- Working directory changed
- Server was run from different locations
- Path resolution was inconsistent between the upload middleware and static serving

**Solution**: Changed to absolute path resolution:
```javascript
// NEW CODE
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));
```

Additionally, fixed the upload middleware path to correctly point to the project root:
```javascript
// CORRECTED PATH (in upload.js)
const uploadDir = path.join(__dirname, "../../uploads/payment-proofs");
// Explanation:
// __dirname = server/middleware/
// ../.. = goes up to project root
// Result: /project-root/uploads/payment-proofs/
```

## File Changes Made

### 1. `server/middleware/upload.js` - ✅ UPDATED
**Changes**:
- Added disk storage configuration with automatic directory creation
- Configured unique filename generation with timestamp and random ID
- Added file type validation (only images allowed)
- Reduced file size limit from 10MB to 5MB for images
- Fixed path calculation to correctly point to project root

```javascript
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "../../uploads/payment-proofs");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `paymentproof_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, uniqueName);
  }
});

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
  limits: { fileSize: 5 * 1024 * 1024 }
});
```

### 2. `server/controllers/paymentController.js` - ✅ UPDATED
**Changes**:
- Updated payment query to handle both initial submissions and resubmissions
- Added clearing of rejection reason when proof is resubmitted
- Improved error message for better user guidance

```javascript
// Find the payment for this user and team (can be pending_verification or failed/rejected)
const payment = await Payment.findOne({
  userId: req.user._id,
  teamId,
  status: { $in: ["pending_verification", "failed"] }
});

if (!payment) {
  throw new AppError("No pending payment found for this team. Please create a team and order first.", 404);
}

// Store file path
const fileUrl = `/uploads/payment-proofs/${req.file.filename}`;

payment.paymentProofFile = fileUrl;
payment.paymentProofSubmittedAt = new Date();
payment.status = "pending_verification";
payment.rejectionReason = null;  // Clear any previous rejection reason
```

### 3. `server/server.js` - ✅ UPDATED
**Changes**:
- Added imports for `path` and `fileURLToPath`
- Computed `__dirname` using ES module approach
- Changed static middleware to use absolute path

```javascript
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ... middleware setup ...

const uploadsDir = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));
```

## Data Flow After Fix

### User Submits Payment Proof
```
1. Frontend: POST /api/payments/submit-proof
   ├─ Multer middleware processes file
   ├─ File saved to disk: /uploads/payment-proofs/paymentproof_<timestamp>_<random>.jpg
   └─ Filename returned as req.file.filename

2. Backend (paymentController.js)
   ├─ Queries payment with status: { $in: ["pending_verification", "failed"] }
   ├─ Sets paymentProofFile = `/uploads/payment-proofs/paymentproof_<timestamp>_<random>.jpg`
   ├─ Sets paymentProofSubmittedAt = current date
   ├─ Updates status to "pending_verification"
   ├─ Clears rejectionReason
   └─ Saves payment to MongoDB

3. Database (MongoDB)
   └─ Payment document now contains:
      └─ paymentProofFile: "/uploads/payment-proofs/paymentproof_<timestamp>_<random>.jpg"
      └─ status: "pending_verification"
```

### Admin Views Payment Proofs
```
1. Admin: GET /api/admin/payments/verification-status
   ├─ Backend queries payments
   └─ Returns array with paymentProofFile field populated

2. Frontend (AdminPaymentVerificationPage.jsx)
   ├─ Receives payments array with paymentProofFile paths
   └─ Passes to PaymentVerificationCard component

3. PaymentVerificationCard Component
   ├─ Checks if payment.paymentProofFile exists
   ├─ Creates <img src="/uploads/payment-proofs/paymentproof_<timestamp>_<random>.jpg">
   └─ Browser fetches image via HTTP

4. Server (Express.js)
   ├─ Receives GET /uploads/payment-proofs/paymentproof_<timestamp>_<random>.jpg
   ├─ Express static middleware serves file from disk
   └─ Image displays in admin panel
```

## Testing Checklist

- [ ] **File Storage**: Verify `/uploads/payment-proofs/` directory is created when server starts
- [ ] **File Upload**: Submit payment proof and check if file appears in `/uploads/payment-proofs/`
- [ ] **Database**: Verify `payment.paymentProofFile` contains correct file path
- [ ] **Static Serving**: Test accessing image directly via browser: `http://localhost:5000/uploads/payment-proofs/[filename]`
- [ ] **Admin Panel**: Verify admin can see payment proofs in verification page
- [ ] **Image Display**: Click "View Payment Proof" button and verify image loads
- [ ] **Resubmission**: Reject a payment, verify user can resubmit, and admin sees new proof
- [ ] **Error Handling**: Try uploading non-image files and verify proper error message

## Directory Structure Created

```
project-root/
├── uploads/
│   └── payment-proofs/
│       ├── paymentproof_1234567890_abc123.jpg
│       ├── paymentproof_1234567891_def456.png
│       └── ... (other uploaded proofs)
```

## Key Improvements

1. **Persistent Storage**: Files now saved to disk, survives server restarts
2. **Unique Filenames**: Uses timestamp + random ID to prevent collisions
3. **File Validation**: Only image files allowed (jpeg, png, gif, webp)
4. **Size Limits**: Limited to 5MB for efficient storage and transfer
5. **Resubmission Support**: Handles both initial and subsequent proof submissions
6. **Path Consistency**: Both upload destination and static serving use absolute paths
7. **Auto Directory Creation**: Uploads directory automatically created if missing

## Environment Considerations

### Development (Local)
- Server runs from project root
- `/uploads/payment-proofs/` created automatically
- Static middleware correctly serves files to admin panel

### Production (Docker)
- Volumes should be mounted: `/app/uploads:/app/uploads`
- Ensure container has write permissions to volume
- Nginx reverse proxy can serve static files more efficiently

## Rollback Instructions (If Needed)

If you need to revert these changes:
1. Restore original `upload.js` with memoryStorage
2. Restore original `paymentController.js` with single status query
3. Restore original `server.js` static middleware configuration

However, these fixes resolve fundamental issues with file storage and display, so rollback is not recommended.

## Related Documentation

- [Payment Proof Resubmission Fix](PAYMENT_PROOF_RESUBMISSION_FIX.md) - Handles user-side resubmission workflow
- [Admin Payment Approval Guide](ADMIN_PAYMENT_APPROVAL_GUIDE.md) - Admin verification process
- [Payment Flow Documentation](PAYMENT_FLOW_DOCUMENTATION.md) - Complete payment system architecture
