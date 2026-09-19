# Manual Bank Transfer Payment Flow Implementation

## Overview
This document describes the implementation of manual bank transfer payment system for IEEE hackathon registration, replacing the Razorpay online payment gateway.

## College Bank Account Details
- **Account Holder**: MBU CONFERENCES SEMINARS WORKSHOPS ACC
- **Account Number**: 154012010000884
- **IFSC Code**: UBIN0815403
- **Bank Name**: UNION BANK OF INDIA
- **Account Type**: College Business Account

## System Architecture

### User Registration Flow
```
1. User fills registration form (team details, participants)
2. Submit form → Backend creates Team record
3. Backend creates Payment record with status: "pending_verification"
4. Backend returns college bank account details to frontend
5. Frontend displays bank details and payment proof upload form
6. User transfers ₹200 to college account
7. User uploads payment receipt screenshot
8. Payment status: "pending_verification" (awaiting admin review)
9. Admin reviews receipt and approves/rejects
10. On approval → Payment status: "success" → Registration confirmed
11. On rejection → User can reupload receipt
```

### Admin Verification Flow
```
1. Admin views registrations with pending payments
2. Clicks "View Payment Proof" to see screenshot
3. Verifies transfer amount and account details
4. Can approve with optional notes or reject with reason
5. On approve → Team participation confirmed
6. On reject → Reason sent to user, can resubmit
```

## Backend Implementation

### Environment Configuration (`server/.env`)
```
PAYMENT_METHOD=manual
COLLEGE_ACCOUNT_HOLDER=MBU CONFERENCES SEMINARS WORKSHOPS ACC
COLLEGE_ACCOUNT_NUMBER=154012010000884
COLLEGE_IFSC_CODE=UBIN0815403
COLLEGE_BANK_NAME=UNION BANK OF INDIA
```

### Database Schema Changes

#### Payment Model (`server/models/Payment.js`)
New fields for manual payment tracking:
```javascript
{
  paymentMethod: "manual_bank_transfer",  // New value
  status: "pending_verification",         // New value
  paymentProofFile: String,               // File path to screenshot
  paymentProofSubmittedAt: Date,          // When user uploaded proof
  paymentApprovedBy: ObjectId,            // Admin user ID who approved
  paymentApprovedAt: Date,                // When admin verified
  rejectionReason: String                 // If rejected, reason why
}
```

### API Endpoints

#### 1. Registration Creation - `POST /registration/team`
**Input**: Registration form data + optional bankDetails
**Response** (Manual Payment Mode):
```json
{
  "message": "Team created. Please submit payment proof.",
  "team": { /* team data */ },
  "paymentStatus": "pending_verification",
  "feeInr": 200,
  "bankDetails": {
    "accountHolder": "MBU CONFERENCES SEMINARS WORKSHOPS ACC",
    "accountNumber": "154012010000884",
    "ifscCode": "UBIN0815403",
    "bankName": "UNION BANK OF INDIA"
  }
}
```

#### 2. Submit Payment Proof - `POST /payments/submit-proof`
**Authentication**: Required (user)
**Headers**: `Content-Type: multipart/form-data`
**Body**:
```
- paymentProof: File (image only, max 5MB)
- teamId: string
```
**Response**:
```json
{
  "message": "Payment proof submitted successfully. Please wait for admin verification.",
  "payment": {
    "_id": "...",
    "status": "pending_verification",
    "paymentProofSubmittedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 3. Verify Payment - `PATCH /admin/payments/:paymentId/verify`
**Authentication**: Required (admin only)
**Body**:
```json
{
  "verificationStatus": "approved" | "rejected",
  "adminNotes": "Optional reason or approval notes"
}
```
**Response**:
```json
{
  "message": "Payment approved successfully",
  "payment": {
    "_id": "...",
    "status": "success",
    "paymentApprovedAt": "2024-01-15T11:00:00Z"
  },
  "team": {
    "_id": "...",
    "name": "Team Name",
    "participationConfirmed": true
  }
}
```

### Controller Changes

#### `registrationController.js`
- Updated `createTeamAndOrder()` to check `PAYMENT_METHOD` configuration
- If `PAYMENT_METHOD === "manual"`:
  - Skip Razorpay order creation
  - Create Payment record with status: `"pending_verification"`
  - Return college bank account details instead of Razorpay order
- Maintains backward compatibility with Razorpay mode

#### `paymentController.js`
- Added `submitManualPaymentProof()` endpoint handler
- Accepts file upload from user
- Stores file path in Payment record
- Sets status for admin verification
- Logs audit trail

#### `adminController.js`
- Added `verifyManualPayment()` endpoint handler
- Validates payment exists and is pending
- Updates Payment record with approval status
- Updates Team's `participationConfirmed` flag on approval
- Logs audit trail with admin decision

### Route Configuration

#### Payment Routes (`server/routes/paymentRoutes.js`)
```javascript
router.post("/submit-proof", protect, authorize("participant"), upload.single("paymentProof"), submitManualPaymentProof);
```

#### Admin Routes (`server/routes/adminRoutes.js`)
```javascript
router.patch("/payments/:paymentId/verify", protect, authorize("admin"), validate(verifyManualPaymentSchema), verifyManualPayment);
```

## Frontend Implementation

### New Components

#### 1. `CollegePaymentDetailsCard.jsx`
Displays college bank account details to users during registration:
- Account holder name (with copy button)
- Account number (masked, toggleable reveal)
- IFSC code (with copy button)
- Bank name
- Instructions for payment

#### 2. `PaymentProofUploadForm.jsx`
File upload interface for users to submit payment receipt:
- Drag & drop or click to select image
- Image preview before upload
- Validation: image type only, max 5MB
- Upload progress and status messages
- Displays amount to transfer
- Instructions for admin verification

#### 3. `PaymentVerificationCard.jsx`
Admin interface for reviewing and verifying payments:
- Displays payment status badge
- Shows payment proof image
- Click to reveal/hide screenshot
- Admin notes textarea (for pending payments)
- Approve/Reject buttons with confirmation
- Shows rejection reason if applicable
- Error handling and loading states

### Registration Page Updates (`HackathonRegistrationPage.jsx`)
- Imports new payment components
- Checks `orderData.bankDetails` to detect manual payment mode
- Shows `CollegePaymentDetailsCard` instead of Razorpay button
- Shows `PaymentProofUploadForm` after successful registration
- Maintains backward compatibility with Razorpay flow via `orderData.order`

### Payment Status Display
Registration status indicators updated to show:
- `pending_verification` (yellow): Awaiting admin review
- `success` (green): Payment approved, registration confirmed
- `failed` (red): Payment rejected, can resubmit

## Configuration Switch

### To Enable Manual Payment
In `server/.env`:
```
PAYMENT_METHOD=manual
COLLEGE_ACCOUNT_HOLDER=MBU CONFERENCES SEMINARS WORKSHOPS ACC
COLLEGE_ACCOUNT_NUMBER=154012010000884
COLLEGE_IFSC_CODE=UBIN0815403
COLLEGE_BANK_NAME=UNION BANK OF INDIA
```

### To Use Razorpay (existing system)
In `server/.env`:
```
PAYMENT_METHOD=razorpay
# Keep existing Razorpay keys
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

## Security Considerations

1. **File Upload Validation**
   - Only image files accepted (image/* MIME type)
   - Maximum file size: 5MB
   - Stored with secure file naming

2. **Authentication**
   - All payment endpoints require user authentication
   - Admin verification endpoints require admin role
   - Payment verification restricted to team's owner

3. **Authorization**
   - Users can only submit proof for their own teams
   - Only admins can verify/reject payments
   - Audit trail logged for all admin actions

4. **Data Integrity**
   - Payment status transitions validated
   - Team participation only unlocked after admin approval
   - Duplicate fields removed from schema

## Testing Checklist

- [ ] User registration with manual payment mode
- [ ] Bank details displayed correctly to user
- [ ] Payment proof file upload and validation
- [ ] Admin payment verification UI loads
- [ ] Admin can approve payment
- [ ] Admin can reject payment with reason
- [ ] Team participation confirmed on approval
- [ ] Reupload allowed on rejection
- [ ] Razorpay mode still works (backward compatibility)
- [ ] Payment status transitions correctly
- [ ] Audit logs capture all actions

## Files Modified

### Backend
- `server/config/env.js` - Added college bank config schema
- `server/.env` - Added college bank details
- `server/models/Payment.js` - Added manual payment fields
- `server/controllers/registrationController.js` - Check payment method
- `server/controllers/paymentController.js` - Added submitManualPaymentProof
- `server/controllers/adminController.js` - Added verifyManualPayment
- `server/routes/paymentRoutes.js` - Added submit-proof endpoint
- `server/routes/adminRoutes.js` - Added verify payment endpoint

### Frontend
- `client/src/pages/HackathonRegistrationPage.jsx` - Updated to show bank details and file upload
- `client/src/components/CollegePaymentDetailsCard.jsx` - NEW
- `client/src/components/PaymentProofUploadForm.jsx` - NEW
- `client/src/components/PaymentVerificationCard.jsx` - NEW

## Future Enhancements

1. **Email Notifications**
   - Send email to user when payment is approved/rejected
   - Notify admin when payment proof is submitted

2. **Payment Tracking**
   - Dashboard showing payment statistics
   - Pending payment count by date
   - Approval rate metrics

3. **Bulk Operations**
   - Bulk approve payments
   - Bulk reject with template reasons
   - Export payment verification report

4. **Document Management**
   - Archive verified payment proofs
   - Generate payment verification certificate
   - Monthly reconciliation report

## Troubleshooting

### Payment proof upload fails
- Check file size (max 5MB)
- Verify file is image format (PNG, JPG, JPEG, GIF, WEBP)
- Check server file upload middleware configuration
- Ensure `/uploads/payment-proofs/` directory exists and is writable

### Admin can't see verification button
- Verify user has admin role
- Check payment status is "pending_verification"
- Ensure payment has paymentProofFile set

### Team can't register after payment approval
- Check if team.participationConfirmed flag is set
- Verify payment.status is "success"
- Check registration closing status in EventSettings

### Payment method not switching
- Verify PAYMENT_METHOD env variable is set
- Restart backend server after env changes
- Check server logs for env config loading

## Support & Documentation
For issues or questions about the manual payment system, refer to:
- Conversation history with implementation details
- API endpoint test cases
- Environment configuration template
