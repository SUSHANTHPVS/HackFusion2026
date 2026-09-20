# Manual Payment Proof - Admin Alert Implementation

## Overview
Email alerts are automatically sent to admin when participants submit manual payment proofs for verification. These alerts notify administrators of new payment submissions that require review and approval.

## Feature Summary

### When Email is Sent
- **Trigger**: Participant submits a manual payment proof via the Payment Verification page
- **Recipient**: Admin emails configured in `PAYMENT_ALERT_EMAILS` environment variable
- **Default Email**: `pvsushanthpvs@gmail.com` (from .env)
- **Email Service**: Nodemailer with Gmail SMTP (smtp.gmail.com:587)

### What's in the Email

Each admin alert contains:

1. **Transaction Details**
   - Amount in INR (formatted with ₹ symbol)
   - Date/time of submission
   - Order ID (reference number)

2. **Participant Information**
   - Participant's name
   - Participant's email address
   - Team name

3. **Bank Transfer Information**
   - UTR (Unique Transaction Reference) number
   - Transaction ID (if provided)
   - Link to payment proof file (screenshot/document)

4. **Action Prompt**
   - Clear warning that manual verification is required
   - Direct link to admin Payment Verification page
   - Reminder to approve or reject the proof

### Email Design
- Professional HTML template with color-coded sections
- Gradient header with payment icon
- Mobile-responsive layout
- Clear visual hierarchy for easy scanning
- Direct action button to admin panel

## Technical Implementation

### Email Service Function

**File**: `server/services/emailService.js`
**Function**: `sendPaymentProofAlertEmail()`

**Parameters**:
```javascript
{
  orderId,           // Unique payment order reference
  amount,            // Payment amount (number)
  currency,          // Currency code (default: "INR")
  participantName,   // Name of participant
  participantEmail,  // Email of participant
  teamName,          // Name of team
  proofFile,         // URL to uploaded payment proof file
  utrNumber,         // UTR number for bank transfer
  transactionId,     // Transaction ID (optional)
  timestamp          // When proof was submitted
}
```

### Integration Point

**File**: `server/controllers/paymentController.js`
**Function**: `submitManualPaymentProof()`

**When Called**:
- After participant uploads payment proof file
- After payment proof is saved to database
- Asynchronously (non-blocking)

**Implementation**:
```javascript
// Send admin alert email
const team = await Team.findById(teamId).lean();
sendPaymentProofAlertEmail({
  orderId: payment.orderId,
  amount: payment.amount,
  currency: "INR",
  participantName: req.user.name,
  participantEmail: req.user.email,
  teamName: team?.name || "Unknown Team",
  proofFile: fileUrl,
  utrNumber: payment.utrNumber,
  transactionId: payment.transactionId,
  timestamp: payment.paymentProofSubmittedAt
})
  .catch((emailError) => {
    console.error("Failed to send admin payment alert email:", emailError.message);
    // Email failure does not block payment submission
  });
```

## Payment Flow

```
Step 1: Participant navigates to Payment Verification page
          ↓
Step 2: Participant uploads bank statement/screenshot
          ↓
Step 3: Participant enters UTR number and Transaction ID
          ↓
Step 4: Participant clicks "Submit Proof" button
          ↓
Step 5: Server saves payment proof to database
          ↓
Step 6: Admin alert email is sent to PAYMENT_ALERT_EMAILS
          ↓
Step 7: Admin receives email with payment details
          ↓
Step 8: Admin clicks link to open Payment Verification page
          ↓
Step 9: Admin reviews the payment proof file
          ↓
Step 10: Admin approves or rejects the payment
          ↓
Step 11: Participant receives approval/rejection notification
```

## Environment Configuration

### Required .env Variables
```
SMTP_HOST=smtp.gmail.com          # Gmail SMTP server
SMTP_PORT=587                      # Gmail SMTP port
SMTP_USER=your-email@gmail.com     # Gmail account for sending
SMTP_PASS=your-app-password        # Gmail app-specific password
SMTP_FROM=noreply@hackathon.com    # From address in emails
PAYMENT_ALERT_EMAILS=admin1@example.com,admin2@example.com
CLIENT_ORIGIN=http://localhost:5173  # For links in email
```

### Current Setup (from .env)
- Admin emails: `pvsushanthpv@gmail.com`, `pvsushanthpvs@gmail.com`
- Email system: Gmail SMTP
- Sender: Hackathon Registration System

## Error Handling

**Email Failures Are Non-Blocking**:
- If email fails to send, the error is logged to console
- Payment proof submission succeeds regardless
- Participant gets success response
- Error message: `[submitManualPaymentProof] Failed to send admin payment alert email:`

**Console Logs to Check**:
```
[submitManualPaymentProof] File Upload Details
[submitManualPaymentProof] ✓ File verified on disk
[submitManualPaymentProof] Failed to send admin payment alert email: (if error occurs)
```

## Manual Testing

### Test Scenario
1. Open hackathon registration system
2. Register a new team
3. Go to Payment page and create a payment order
4. Navigate to Payment Verification page
5. Upload an image/PDF as payment proof
6. Enter UTR number (e.g., "123456789")
7. Enter Transaction ID (e.g., "TXN12345")
8. Click "Submit Proof"
9. Check admin email inbox for alert

### What to Verify
- ✓ Email arrives within 1-2 minutes
- ✓ Email subject mentions payment amount
- ✓ Email contains participant name and email
- ✓ Email contains UTR number and Transaction ID
- ✓ Email has direct link to Payment Verification page
- ✓ Payment proof file is accessible via link in email

## Related Features

### Payment Verification Page
- **Location**: Admin dashboard → Payments → Verification
- **Function**: Review and approve/reject submitted payment proofs
- **Triggered By**: Admin alert emails guide admins here

### Participant Email Notifications
- Separate system sends confirmation to participants
- Notifications on approval or rejection of payment proof
- Not triggered by payment proof email system

### Payment Audit Trail
- All payment submissions logged in audit table
- Event: `MANUAL_PROOF_SUBMITTED`
- Includes: File details, timestamps, user info

## System Architecture Context

### Payment Methods
- **Only Payment Type**: Manual bank transfer
- **No Razorpay**: Application uses manual verification only
- **Payment Status Flow**: 
  - `pending_verification` (initial state when order created)
  - `pending_verification` (after proof submitted, awaiting admin)
  - `verified` (admin approved)
  - `rejected` (admin rejected)

### Who Gets Emails
- Only **admin users** receive payment proof alerts
- Participants receive separate confirmation/rejection emails
- Both emails come from same Nodemailer service

## Debugging Tips

### If emails aren't being sent:
1. Check `.env` has `PAYMENT_ALERT_EMAILS` configured
2. Verify Gmail app password is correct
3. Check Gmail account has "Less secure app access" enabled (if applicable)
4. Look at server console for error messages with `[submitManualPaymentProof]` prefix

### If emails are delayed:
1. Gmail may throttle if many emails sent quickly
2. Check Gmail spam folder
3. Verify SMTP connection is stable

### If links in email don't work:
1. Verify `CLIENT_ORIGIN` environment variable is set correctly
2. Check payment proof file URL is accessible
3. Ensure file upload destination is writable

## Files Modified

1. **server/services/emailService.js**
   - Added: `sendPaymentProofAlertEmail()` function
   - Handles: Payment proof submission alerts

2. **server/controllers/paymentController.js**
   - Import: `sendPaymentProofAlertEmail` from emailService
   - Call: In `submitManualPaymentProof()` function
   - Pattern: Non-blocking async with error handling

## Future Enhancements

Possible improvements:
- SMS alerts in addition to email
- Reminder emails if payment not verified within X days
- Batch digests of multiple submissions
- Payment proof expiry warnings
- Automated payment amount validation
- Multi-step approval workflows

