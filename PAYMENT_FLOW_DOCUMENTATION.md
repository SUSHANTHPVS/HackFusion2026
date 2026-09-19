# IEEE Hackathon Payment Flow Documentation

## Overview
The system uses a **manual bank transfer payment method** (switched from Razorpay). Users must manually transfer funds to the college account and submit proof for admin verification.

---

## 🔄 Complete Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────────┘

STEP 1: REGISTRATION
┌─────────────────────────────────────────────────────────────────────────────────┐
│ User fills Registration Form (HackathonRegistrationPage.jsx)                    │
│                                                                                  │
│ Fields Required:                                                                 │
│   1. Name of Your College ⭐ (FIRST FIELD)                                      │
│   2. Team Name                                                                   │
│   3. Team Leader Name                                                            │
│   4. Roll No                                                                     │
│   5. Email (auto-filled from login)                                              │
│   6. Gender                                                                      │
│   7. Branch (free-text input)                                                    │
│   8. Section (free-text input)                                                   │
│   9. Year                                                                        │
│   10. IEEE Member details                                                       │
│   11. Team Composition (2-4 members)                                             │
│                                                                                  │
│ On Submit: Calls createOrderMutation API                                        │
│   Payload: {                                                                     │
│     teamName, teamLeaderName, collegeName, leaderGender,                        │
│     rollNo, year, branch, section, themeTrack,                                  │
│     teammates: [{name, email, gender, rollNo, mobile,                           │
│                  year, branch, section, ieeeMember, ieeeMemberId}]              │
│   }                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    ↓
STEP 2: PAYMENT RECORD CREATION
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Backend (registrationController.js): createOrderHandler                         │
│                                                                                  │
│ 1. Extract & Validate Registration Data                                         │
│    - Extract: teamName, teamLeaderName, collegeName, rollNo, year,              │
│      branch, section, leaderGender, themeTrack, teammates                       │
│    - Normalize: uppercase roll numbers, trim whitespace                         │
│                                                                                  │
│ 2. Check for Duplicate Entries                                                  │
│    - Verify roll numbers aren't already registered                              │
│    - Verify names aren't duplicated in team                                     │
│    - Check team composition (3-4 members)                                       │
│                                                                                  │
│ 3. Create or Update Team Record (Team.js model)                                 │
│    Database Fields:                                                              │
│      - name, leader, leaderName, collegeName ⭐ (NEW)                           │
│      - leaderGender, rollNo, year, branch, section                              │
│      - members, teammates, themeTrack, bankDetails                              │
│      - status: "registered" (initial), participationType: "team"                │
│                                                                                  │
│ 4. Create Payment Record (Payment.js model)                                     │
│    Database Fields:                                                              │
│      - orderId: unique identifier                                               │
│      - userId, teamId: references                                               │
│      - amount: 200 (INR) → 20000 (paise)                                        │
│      - status: "created" (initial)                                              │
│                                                                                  │
│ 5. Return Order Details                                                         │
│    Response: {                                                                   │
│      orderId, teamId, amount, currency: "INR",                                  │
│      bankDetails: {                                                              │
│        accountHolder: "MBU CONFERENCES SEMINARS WORKSHOPS ACC",                  │
│        accountNumber: "154012010000884",                                        │
│        ifscCode: "UBIN0815403",                                                 │
│        bankName: "UNION BANK OF INDIA"                                          │
│      }                                                                           │
│    }                                                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    ↓
STEP 3: PAYMENT INSTRUCTIONS DISPLAY
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Frontend: CollegePaymentDetailsCard Component                                   │
│                                                                                  │
│ Displays to User:                                                                │
│   ✓ Bank Name: UNION BANK OF INDIA                                              │
│   ✓ Account Holder: MBU CONFERENCES SEMINARS WORKSHOPS ACC                      │
│   ✓ Account Number: 154012010000884                                             │
│   ✓ IFSC Code: UBIN0815403                                                      │
│   ✓ Amount to Transfer: ₹200 (per team)                                         │
│   ✓ QR Code (for mobile payment - optional)                                     │
│   ✓ Instructions: "Upload screenshot/proof of payment"                          │
│                                                                                  │
│ User Action:                                                                     │
│   1. User transfers ₹200 from their bank account to college account             │
│   2. Takes screenshot or saves receipt as proof                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    ↓
STEP 4: PAYMENT PROOF UPLOAD
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Frontend: PaymentProofUploadForm Component                                      │
│                                                                                  │
│ Form Fields:                                                                     │
│   1. Payment Proof File (Image Upload - required)                               │
│      - Accepted: JPEG, PNG, WebP, BMP, TIFF                                     │
│      - Max Size: 5MB                                                            │
│      - Validation: File type & size checked before upload                       │
│                                                                                  │
│   2. UTR Number (Optional) ⭐ NEW                                               │
│      - User Reference Number from their bank statement                          │
│      - Helps identify transaction on bank side                                  │
│      - Example: "123456789012"                                                  │
│                                                                                  │
│   3. Transaction ID (Optional) ⭐ NEW                                           │
│      - Reference ID from mobile banking / NEFT transfer                         │
│      - Alternative tracking number                                              │
│      - Example: "NEFT1234567890"                                                │
│                                                                                  │
│ On Submit: Calls handleUpload() function                                        │
│   Payload (FormData):                                                            │
│     - paymentProof: File object                                                 │
│     - teamId: String                                                             │
│     - utrNumber: String (optional, trimmed)                                     │
│     - transactionId: String (optional, trimmed)                                 │
│                                                                                  │
│   Endpoint: POST /payments/submit-proof                                         │
│   Authentication: Required (JWT token)                                          │
│   Authorization: participant role only                                          │
│   Middleware:                                                                    │
│     - protect (auth middleware)                                                 │
│     - authorize("participant")                                                  │
│     - upload.single("paymentProof") (Multer file handling)                      │
│     - validate(submitPaymentProofSchema) (Zod validation)                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    ↓
STEP 5: BACKEND PROOF PROCESSING
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Backend: paymentController.submitManualPaymentProof()                           │
│                                                                                  │
│ Validation Layer (Zod Schema):                                                  │
│   ✓ teamId: required string                                                     │
│   ✓ utrNumber: optional string (trimmed)                                        │
│   ✓ transactionId: optional string (trimmed)                                    │
│   ✓ paymentProof: required file (via Multer middleware)                         │
│                                                                                  │
│ Processing Steps:                                                                │
│   1. Verify file exists                                                         │
│   2. Verify teamId exists                                                       │
│   3. Find Payment record:                                                       │
│      - userId: req.user._id                                                     │
│      - teamId: from request                                                     │
│      - status: "pending_verification"                                           │
│      [Note: Payment must exist from Step 2]                                     │
│                                                                                  │
│   4. If payment not found → Error 404                                           │
│                                                                                  │
│   5. Store File                                                                  │
│      - fileUrl = `/uploads/payment-proofs/${filename}`                          │
│      - Saved to disk in production                                              │
│                                                                                  │
│   6. Update Payment Record                                                      │
│      payment.paymentProofFile = fileUrl                                         │
│      payment.paymentProofSubmittedAt = new Date()                               │
│      payment.status = "pending_verification"                                    │
│      payment.utrNumber = utrNumber.trim() (if provided)                         │
│      payment.transactionId = transactionId.trim() (if provided)                 │
│                                                                                  │
│   7. Audit Log Entry                                                            │
│      - eventType: "MANUAL_PROOF_SUBMITTED"                                      │
│      - source: "user"                                                           │
│      - Payload includes: proofFile, submittedAt, utrNumber, transactionId       │
│                                                                                  │
│   8. Response to Frontend                                                       │
│      {                                                                           │
│        message: "Payment proof submitted successfully...",                      │
│        payment: {                                                                │
│          _id, status: "pending_verification",                                   │
│          paymentProofSubmittedAt                                                │
│        }                                                                         │
│      }                                                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    ↓
STEP 6: ADMIN VERIFICATION
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Admin Dashboard (adminController.js)                                            │
│                                                                                  │
│ Admin Views:                                                                     │
│   1. Pending Payments List                                                      │
│      - Filter by status: "pending_verification"                                 │
│      - Shows: TeamName, LeaderName, CollegeName, Amount, Submitted Date         │
│      - Shows: UTR Number (if provided)                                          │
│      - Shows: Transaction ID (if provided)                                      │
│                                                                                  │
│   2. Payment Details Card                                                       │
│      - View payment proof image                                                 │
│      - View bank transfer details (UTR, Transaction ID)                         │
│      - Verify against bank records                                              │
│                                                                                  │
│   3. Admin Actions:                                                              │
│      A) APPROVE Payment                                                         │
│         - Checks proof is valid                                                 │
│         - Verifies UTR/Transaction ID against bank (if provided)                │
│         - Updates: payment.status = "success"                                   │
│         - Updates: payment.paymentApprovedBy = adminUserId                      │
│         - Updates: payment.paymentApprovedAt = new Date()                       │
│         - Updates: Team.status = "checked-in"                                   │
│         - Sends confirmation email to participant                               │
│         - Audit log: MANUAL_PROOF_APPROVED                                      │
│                                                                                  │
│      B) REJECT Payment                                                          │
│         - Admin provides rejection reason                                       │
│         - Updates: payment.status = "failed"                                    │
│         - Updates: payment.rejectionReason = reasonText                         │
│         - Sends rejection email to participant                                  │
│         - Participant can re-upload proof                                       │
│         - Audit log: MANUAL_PROOF_REJECTED                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    ↓
STEP 7: REGISTRATION SUCCESS
┌─────────────────────────────────────────────────────────────────────────────────┐
│ After Admin Approval (payment.status = "success")                               │
│                                                                                  │
│ System Updates:                                                                  │
│   ✓ Team record marked as paid                                                  │
│   ✓ All team members eligible for check-in                                      │
│   ✓ Registration slots reserved for team                                        │
│   ✓ Confirmation email sent to team leader                                      │
│   ✓ Team can now participate in hackathon                                       │
│                                                                                  │
│ Database State:                                                                  │
│   Team.status: "registered" → "checked-in" (if admin marks)                     │
│   Payment.status: "created" → "pending_verification" → "success"                │
│   Payment.paymentProofFile: contains file path                                  │
│   Payment.utrNumber: stored (if provided)                                       │
│   Payment.transactionId: stored (if provided)                                   │
│   Payment.paymentApprovedBy: admin user reference                               │
│   Payment.paymentApprovedAt: approval timestamp                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Payment Model Schema

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  teamId: ObjectId (ref: Team),
  orderId: String (unique),
  amount: Number (in paise, e.g., 20000 = ₹200),
  status: "created" | "success" | "failed" | "pending_verification",
  
  // Manual Bank Transfer Fields
  paymentProofFile: String (file path),
  paymentProofSubmittedAt: Date,
  paymentApprovedBy: ObjectId (ref: User - admin),
  paymentApprovedAt: Date,
  rejectionReason: String,
  
  // NEW: Bank Transfer Tracking
  utrNumber: String (optional),
  transactionId: String (optional),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📊 Team Model Changes

```javascript
{
  // ... existing fields ...
  
  leaderName: String (required),
  collegeName: String (required) ⭐ NEW - College/Institution name
  
  // ... rest of fields ...
}
```

---

## 🔑 Key Configuration

**File**: `server/config/env.js`

```javascript
PAYMENT_METHOD: "manual"  // Can be "razorpay" or "manual"
REGISTRATION_CAPACITY: 125  // Max participants allowed
```

---

## 💾 Bank Account Details (Displayed to Users)

```
Bank: UNION BANK OF INDIA
Account Holder: MBU CONFERENCES SEMINARS WORKSHOPS ACC
Account Number: 154012010000884
IFSC Code: UBIN0815403
Registration Fee: ₹200 per team
```

---

## 🔐 API Endpoints

### 1. Create Registration Order
```
POST /registrations/create-order
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

Request:
{
  teamName: string,
  teamLeaderName: string,
  collegeName: string,
  leaderGender: string,
  rollNo: string,
  year: string,
  branch: string,
  section: string,
  themeTrack: string,
  teammates: [...]
}

Response (201):
{
  orderId: string,
  teamId: ObjectId,
  amount: number,
  currency: "INR",
  bankDetails: {
    accountHolder: string,
    accountNumber: string,
    ifscCode: string,
    bankName: string
  }
}
```

### 2. Submit Payment Proof
```
POST /payments/submit-proof
Content-Type: multipart/form-data
Authorization: Bearer {JWT_TOKEN}

Request:
{
  paymentProof: File (image),
  teamId: string,
  utrNumber: string (optional),
  transactionId: string (optional)
}

Response (200):
{
  message: "Payment proof submitted successfully...",
  payment: {
    _id: ObjectId,
    status: "pending_verification",
    paymentProofSubmittedAt: Date
  }
}
```

### 3. Admin Verify Payment
```
PUT /admin/payments/{paymentId}/verify
Authorization: Bearer {JWT_TOKEN} (admin only)

Request:
{
  action: "approve" | "reject",
  rejectionReason: string (required if action is "reject")
}

Response (200):
{
  message: "Payment verified",
  payment: {
    status: "success" | "failed",
    paymentApprovedAt: Date
  }
}
```

---

## ✅ Payment Status Lifecycle

```
┌──────────┐
│ created  │  ← Initial: Team registration created, payment record created
└────┬─────┘
     │ User submits proof
     ↓
┌──────────────────────┐
│ pending_verification │  ← Waiting for admin approval
└──────┬───────────────┘
       │
       ├─→ Admin Approves ──→ ┌─────────┐
       │                      │ success │  ← Registration confirmed, team can participate
       │                      └─────────┘
       │
       └─→ Admin Rejects ──→ ┌─────────┐
                             │ failed  │  ← User can re-upload proof
                             └─────────┘
```

---

## 🔍 Audit Trail

All payment events are logged in `PaymentAudit` collection:

```javascript
{
  paymentRef: ObjectId,
  orderId: String,
  userId: ObjectId,
  teamId: ObjectId,
  eventType: "MANUAL_PROOF_SUBMITTED" | "MANUAL_PROOF_APPROVED" | "MANUAL_PROOF_REJECTED",
  source: "user" | "admin" | "system",
  status: "info" | "success" | "failed",
  message: String,
  payload: Object (includes utrNumber, transactionId),
  createdAt: Date
}
```

---

## 📋 Feature Highlights

✅ **Manual Bank Transfer Method**
- Users transfer funds directly to college account
- No intermediate payment gateway fees
- Full control over payment records

✅ **Bank Transfer Tracking**
- UTR Number field for NEFT/RTGS transactions
- Transaction ID for mobile banking transfers
- Helps admins reconcile payments with bank records

✅ **College Name Requirement**
- First field in registration form
- Enables institutional data collection
- Better tracking of registrations by college

✅ **Flexible Branch & Section**
- Free-text input instead of dropdowns
- Accommodates different institutional structures
- No predefined constraints

✅ **Admin Verification Dashboard**
- View pending payment proofs
- Approve/reject with audit trail
- Track rejection reasons

✅ **Email Notifications**
- Confirmation on successful registration
- Alert on payment rejection
- Dispute notifications (if integrated with payment gateway)

---

## 🚀 Environment Variables

```
PAYMENT_METHOD=manual
REGISTRATION_CAPACITY=125
UPLOAD_DIR=/uploads/payment-proofs
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/bmp,image/tiff
```

---

## 📝 Notes

1. **Feature Flag Pattern**: The `PAYMENT_METHOD` environment variable allows switching between payment methods without code changes.

2. **Audit Logging**: All payment events are logged for compliance and debugging purposes.

3. **File Storage**: Payment proof images stored in `/uploads/payment-proofs/` directory (in production, should use cloud storage like S3).

4. **Backward Compatibility**: New fields (collegeName, utrNumber, transactionId) are optional or already supported by database schema.

5. **Security**: 
   - Authentication required for all payment endpoints
   - File upload validation (type, size)
   - Admin-only approval endpoints
   - Payment records cannot be manipulated by users

