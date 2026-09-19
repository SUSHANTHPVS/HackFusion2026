# Manual Payment Flow - Deployment & Testing Guide

## Quick Start (5 minutes)

### 1. Enable Manual Payment Mode
Edit `server/.env`:
```bash
PAYMENT_METHOD=manual
COLLEGE_ACCOUNT_HOLDER=MBU CONFERENCES SEMINARS WORKSHOPS ACC
COLLEGE_ACCOUNT_NUMBER=154012010000884
COLLEGE_IFSC_CODE=UBIN0815403
COLLEGE_BANK_NAME=UNION BANK OF INDIA
```

### 2. Restart Backend
```bash
# Stop current server
# Restart with updated env
npm start
```

### 3. Test Registration Flow
- Go to `/hackathon-register`
- Fill in team and participant details
- Click "Create Registration Order"
- You should see college bank details with payment proof upload form

## Complete System Architecture

### Database Flow
```
User Registration Form
    ↓
Create Team + Payment Record
    ↓ (status: "pending_verification")
Response with College Bank Details + Proof Upload Form
    ↓
User Transfers ₹200 to College Account
    ↓
User Uploads Receipt Screenshot
    ↓ (POST /payments/submit-proof)
Admin Verifies Payment
    ↓ (PATCH /admin/payments/:paymentId/verify)
IF APPROVED → Payment Status = "success"
    ↓
Team Eligible for Participation
    ↓
Capacity Counters Include Team
    ↓
Check-in Enabled for Team
```

### Backward Compatibility
If `PAYMENT_METHOD=razorpay`, the system automatically:
- Skips manual payment displays
- Uses Razorpay payment flow
- Returns Razorpay order instead of bank details

## Testing Scenarios

### Scenario 1: Complete Manual Payment Flow ✓
**Steps:**
1. Create account at `/register`
2. Login at `/login`
3. Go to `/hackathon-register`
4. Fill team details with 2-3 teammates
5. Click "Create Registration Order"
6. Verify college bank details display
7. Mock payment transfer (take screenshot)
8. Click "Submit Payment Proof"
9. Upload screenshot of payment
10. Go to admin panel
11. Find team in registrations
12. Open team details
13. Verify payment proof display
14. Click "Approve Payment"
15. Verify team participation enabled

**Expected Results:**
- Registration shows "pending_verification" status
- User can see payment upload form
- Admin sees verification UI
- After approval, payment status shows "success"
- Team shows in capacity count

### Scenario 2: Payment Rejection & Reupload ✓
**Steps:**
1. Complete Scenario 1 through step 9
2. Admin clicks "Reject Payment"
3. Enters rejection reason
4. User sees rejection message
5. User uploads corrected screenshot
6. Admin approves second upload

**Expected Results:**
- Payment status changes to "failed"
- User can resubmit proof
- Audit trail shows both attempts
- Second approval sets status to "success"

### Scenario 3: Razorpay Backward Compatibility ✓
**Steps:**
1. Change `.env` to `PAYMENT_METHOD=razorpay`
2. Restart server
3. Go to `/hackathon-register`
4. Fill team details
5. Click "Create Registration Order"
6. Click "Pay Now via Razorpay"

**Expected Results:**
- Razorpay modal opens
- Manual payment UI hidden
- Payment verification flow works as before

### Scenario 4: Capacity Counting ✓
**Steps:**
1. Register 3 teams with:
   - Team A: payment approved (success)
   - Team B: payment pending (pending_verification)
   - Team C: payment rejected (failed)
2. Check status endpoint

**Expected Results:**
- Capacity count only includes Team A
- Teams B and C don't count
- Response: `{ registered: 3 + 3 + 3 = 9, registeredTeams: 1 }`

## File Structure Reference

```
IEEE WEBSITE/
├── server/
│   ├── config/
│   │   └── env.js ........................... Zod schema with college bank fields
│   ├── .env ................................ College bank constants + PAYMENT_METHOD
│   ├── models/
│   │   ├── Payment.js ...................... Manual payment fields added
│   │   └── Team.js ......................... Unchanged (uses Payment.status)
│   ├── controllers/
│   │   ├── registrationController.js ....... PAYMENT_METHOD check added
│   │   ├── paymentController.js ........... submitManualPaymentProof() NEW
│   │   └── adminController.js ............. verifyManualPayment() NEW
│   ├── routes/
│   │   ├── paymentRoutes.js ............... /submit-proof route NEW
│   │   └── adminRoutes.js ................. /verify route NEW
│   └── middleware/
│       └── upload.js ....................... Multer config for /uploads/payment-proofs/
│
├── client/
│   └── src/
│       ├── pages/
│       │   └── HackathonRegistrationPage.jsx .. Shows manual UI conditionally
│       └── components/
│           ├── CollegePaymentDetailsCard.jsx .. NEW - Bank details display
│           ├── PaymentProofUploadForm.jsx .... NEW - File upload form
│           └── PaymentVerificationCard.jsx ... NEW - Admin verification UI

└── MANUAL_PAYMENT_FLOW_IMPLEMENTATION.md .. Full technical documentation
```

## Common Issues & Solutions

### Issue: "Bank details not showing to user"
**Causes:**
- `PAYMENT_METHOD` env var not set to "manual"
- Server not restarted after env change
- Browser cache not cleared

**Solution:**
```bash
# 1. Verify env var
grep PAYMENT_METHOD server/.env

# 2. Restart server
# Kill current process, restart

# 3. Clear browser cache
# Ctrl+Shift+Delete or Cmd+Shift+Delete
```

### Issue: "File upload fails with 413 error"
**Causes:**
- Express body-size limit too small
- File larger than 5MB

**Solution:**
- Check server.js middleware: `express.json({ limit: "50mb" })`
- User should use smaller image (compress screenshot)

### Issue: "Admin can't see payment verification button"
**Causes:**
- Admin user doesn't have admin role
- Payment.status not "pending_verification"
- Payment.paymentProofFile not set

**Solution:**
```bash
# Check admin role
db.users.findOne({ email: "admin@example.com" })

# Check payment status
db.payments.findOne({ _id: ObjectId("...") })
  // Should have: status: "pending_verification", paymentProofFile: "/uploads/..."
```

### Issue: "Teams show in capacity before approval"
**Causes:**
- registrationCapacityService.js counting wrong status
- Database Payment records corrupted

**Solution:**
```bash
# Verify capacity counting
db.payments.find({ status: "success" }).count()

# Should only count teams with status === "success"
# Delete any with wrong status and recreate
```

### Issue: "PAYMENT_METHOD env not recognized"
**Causes:**
- Variable not exported in env.js schema
- Typo in .env file
- Server process reading stale env

**Solution:**
1. Check `env.js` has `PAYMENT_METHOD` field
2. Verify spelling in `.env`: `PAYMENT_METHOD=manual`
3. Restart server completely (kill all node processes)

## Database Queries for Debugging

```javascript
// Count pending payments
db.payments.countDocuments({ status: "pending_verification" })

// Find pending payments with proof uploaded
db.payments.find({
  status: "pending_verification",
  paymentProofFile: { $exists: true }
})

// Get all payments for a team
db.payments.find({ teamId: ObjectId("...") })

// Count registrations by payment status
db.payments.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Find teams with no payment record
db.teams.aggregate([
  {
    $lookup: {
      from: "payments",
      localField: "_id",
      foreignField: "teamId",
      as: "payment"
    }
  },
  { $match: { payment: { $size: 0 } } }
])
```

## Monitoring Checklist

### Before Going Live
- [ ] Manual payment mode enabled in .env
- [ ] All server files saved and no errors in logs
- [ ] Frontend components imported correctly (no 404s)
- [ ] File upload directory created: `/uploads/payment-proofs/`
- [ ] Directory has write permissions
- [ ] Test registration creates Payment with correct status
- [ ] Bank details display matches college account
- [ ] Test file upload succeeds
- [ ] Admin can approve payment
- [ ] Team counts update after approval
- [ ] Razorpay mode still works (if fallback needed)

### After Going Live
- [ ] Monitor payment submissions (Dashboard)
- [ ] Check file upload disk space
- [ ] Review admin verification turnaround time
- [ ] Track rejection reasons for user guidance
- [ ] Monitor capacity accuracy
- [ ] Backup payment proof images regularly

## Rollback Procedure (if needed)

```bash
# 1. Switch back to Razorpay
vi server/.env
# Change PAYMENT_METHOD=razorpay
# Keep existing RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET

# 2. Restart server
npm restart

# 3. Existing pending payments stay in DB
# They can be manually approved/rejected or left pending
# Frontend will auto-switch back to Razorpay for new registrations

# 4. No data loss - Payment.paymentProofFile field just unused
```

## Future Enhancements

1. **Auto-Webhook from College Bank**
   - If college provides payment API
   - Auto-match transfers to registrations
   - Instant approval when amount detected

2. **Bulk Approval Dashboard**
   - Sort by amount/date/team
   - Bulk approve/reject with one click
   - CSV export of approvals

3. **Payment Proof OCR**
   - Detect amount in screenshot
   - Verify against registration fee
   - Reduce manual review time

4. **Email Integration**
   - Email user when proof submitted
   - Email admin when proof needs review
   - Notification when approved/rejected

5. **Mobile App Support**
   - QR code for payment proof upload
   - Real-time status push notifications
   - Payment receipt in app

## Support Contacts

For technical issues:
1. Check logs: `tail -f server.log`
2. Review database: `mongo ieee_website`
3. Check client console: F12 → Console tab
4. Refer to MANUAL_PAYMENT_FLOW_IMPLEMENTATION.md

## Deployment Checklist

```
PRE-DEPLOYMENT:
  ☐ All code reviewed and tested
  ☐ Database migrations complete
  ☐ Environment variables configured
  ☐ File upload directory ready
  ☐ Backup of current system created
  ☐ Admin trained on verification UI
  ☐ User communication drafted

DEPLOYMENT:
  ☐ Update .env with PAYMENT_METHOD=manual
  ☐ Restart backend server
  ☐ Clear frontend cache (or deploy new build)
  ☐ Test with sample registration
  ☐ Verify bank details display
  ☐ Test file upload
  ☐ Verify admin UI loads
  ☐ Monitor error logs for first hour

POST-DEPLOYMENT:
  ☐ Send user communication about new flow
  ☐ Train admin team on verification
  ☐ Monitor payment submissions
  ☐ Check admin email for notifications
  ☐ Track approval turnaround time
  ☐ Document any issues encountered
  ☐ Plan optimization based on real usage
```

---
**Last Updated**: Phase 3 Complete
**Status**: Production Ready
**Tested**: Manual payment flow end-to-end ✓
**Backward Compatible**: Yes (Razorpay still works)
