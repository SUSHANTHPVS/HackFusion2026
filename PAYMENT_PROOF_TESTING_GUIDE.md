# Payment Proof Display - Quick Test Guide

## 🎯 End-to-End Testing Workflow

### Step 1: User Submits Payment Proof
1. **User Flow**:
   - Go to registration page
   - Create a team with manual payment option
   - Upload payment proof image (JPG/PNG)
   - Should see "Payment proof submitted successfully"
   - Should redirect to payment status page

2. **What's Happening Behind the Scenes**:
   - File saved to: `/uploads/payment-proofs/paymentproof_<timestamp>_<random>.jpg`
   - Database updated with proof file path
   - Payment status set to `pending_verification`

3. **Verification Points**:
   - ✅ No error message during upload
   - ✅ File appears in `/uploads/payment-proofs/` directory on server
   - ✅ User redirected to payment status page

---

### Step 2: Admin Verifies Payment Proof
1. **Admin Flow**:
   - Go to Admin Panel → Payment Verification
   - See list of pending payments
   - Click on a payment to expand
   - Click "View Payment Proof" button
   - Payment proof image should display

2. **What's Happening**:
   - Admin endpoint returns payment with `paymentProofFile` field
   - Frontend receives file path: `/uploads/payment-proofs/paymentproof_<timestamp>_<random>.jpg`
   - Image element loads from static server
   - Static middleware serves file from disk

3. **Verification Points**:
   - ✅ "View Payment Proof" button appears
   - ✅ Clicking button shows image preview
   - ✅ Image displays correctly (not broken image icon)
   - ✅ Can view payment proof before approval/rejection

---

### Step 3: Admin Approves/Rejects Payment
1. **Admin Actions**:
   - After viewing proof, click "Approve Payment" or "Reject Payment"
   - If rejecting, enter rejection reason
   - Submit action
   - Should see success message

2. **Expected Outcomes**:
   - **If Approved**: Payment status → `success`, user receives WhatsApp access
   - **If Rejected**: Payment status → `failed`, rejection reason saved

3. **Verification Points**:
   - ✅ Payment status changes in database
   - ✅ User receives email notification
   - ✅ Admin sees updated status immediately

---

### Step 4: User Resubmits After Rejection
1. **User Flow** (After Rejection):
   - Return to registration page
   - See rejection message with reason
   - See payment proof upload form again
   - Upload new proof image
   - Should redirect to payment status page

2. **What's Happening**:
   - New file saved: `/uploads/payment-proofs/paymentproof_<new_timestamp>_<random>.jpg`
   - Old proof path is overwritten with new proof
   - Payment status returns to `pending_verification`
   - Rejection reason cleared

3. **Verification Points**:
   - ✅ Can upload new proof after rejection
   - ✅ Rejection message disappears
   - ✅ Admin sees new proof in verification panel
   - ✅ Old proof file still on disk but not referenced

---

## 🔍 Technical Verification Checklist

### File System Checks
```bash
# Verify directory structure
ls -la uploads/payment-proofs/

# Expected output:
# -rw-r--r-- user user 12345 Jan 1 12:00 paymentproof_1234567890_abc123.jpg
# -rw-r--r-- user user 23456 Jan 1 12:05 paymentproof_1234567891_def456.jpg
```

### Database Checks
```javascript
// Check payment documents have paymentProofFile
db.payments.find(
  { status: "pending_verification" },
  { paymentProofFile: 1, utrNumber: 1, status: 1 }
)

// Expected output:
// {
//   _id: ObjectId(...),
//   paymentProofFile: "/uploads/payment-proofs/paymentproof_1234567890_abc123.jpg",
//   utrNumber: "1234567890",
//   status: "pending_verification"
// }
```

### Server Response Checks
```bash
# Check admin endpoint returns payment proof paths
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:5000/api/admin/payments/verification-status

# Expected response:
# {
#   "total": 2,
#   "payments": [
#     {
#       "_id": "...",
#       "status": "pending_verification",
#       "paymentProofFile": "/uploads/payment-proofs/paymentproof_1234567890_abc123.jpg",
#       ...
#     }
#   ]
# }
```

### Static File Serving Checks
```bash
# Verify static file serving works
curl -I http://localhost:5000/uploads/payment-proofs/paymentproof_1234567890_abc123.jpg

# Expected response:
# HTTP/1.1 200 OK
# Content-Type: image/jpeg
# Content-Length: 12345
```

### Frontend Console Checks
1. Open browser DevTools → Network tab
2. Go to admin payment verification page
3. Click "View Payment Proof"
4. Check Network tab:
   - ✅ Request to `/api/admin/payments/verification-status` returns data with `paymentProofFile`
   - ✅ Request to `/uploads/payment-proofs/[filename]` returns 200 OK
   - ✅ Image loads without 404 errors

---

## ⚠️ Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Payment proof doesn't upload | File too large or wrong format | Ensure JPG/PNG, < 5MB |
| "View Payment Proof" button doesn't appear | paymentProofFile is null/undefined in DB | Check if upload saved correctly |
| Image shows broken icon | File path incorrect or file deleted | Verify file exists in `/uploads/payment-proofs/` |
| Admin sees no pending payments | Wrong status in database | Query payments with `status: "pending_verification"` |
| 404 when accessing /uploads/payment-proofs/filename | Static middleware misconfigured | Check server.js path configuration |
| Directory permissions error | /uploads folder not writable | Ensure Node.js process has write permissions |

---

## 📊 File Upload Flow Diagram

```
User Browser                   Node.js Server                   File System
     │                              │                              │
     ├──1. Upload Proof ────────────>│                              │
     │   (FormData)                  │                              │
     │                           Multer Middleware                 │
     │                          (diskStorage)                       │
     │                               │──2. Save File ─────────────>│
     │                               │   /uploads/payment-proofs/  │
     │                               │   paymentproof_XXXX.jpg     │
     │                               │<───File Saved ──────────────│
     │                               │                              │
     │                          Payment Controller                  │
     │                               │──3. Save DB Record ─────────>MongoDB
     │                               │   paymentProofFile: "/..."  │
     │<──4. Redirect ────────────────│                              │
     │   /participant/payment-status │                              │
     │                               │                              │
     │                               │                              │
Admin Browser                        │                    File System
     │                               │                              │
     ├──5. Get Payments ────────────>│                              │
     │   /api/admin/payments/...     │                              │
     │                           Admin Controller                   │
     │                               │──6. Query DB ──────────────>MongoDB
     │                               │<──Get Records ──────────────│
     │<──7. Payments List ───────────│   (with proofFile paths)    │
     │   (with proofFile: "...")     │                              │
     │                               │                              │
     ├──8. Load Image ───────────────>│                              │
     │   GET /uploads/payment-proofs/│                              │
     │   paymentproof_XXXX.jpg       │                              │
     │                          Express Static                      │
     │                          Middleware                          │
     │                               │──9. Serve File ──────────────>│
     │<──10. Image Data ─────────────│<───Read File ───────────────│
     │   (JPEG bytes)                │   (from disk)               │
     │                               │                              │
```

---

## ✅ Success Criteria

Your implementation is working correctly when:

1. **Upload Phase** ✅
   - Users can upload payment proofs
   - No file size/format errors
   - Files saved to `/uploads/payment-proofs/` on disk
   - Database records contain file path

2. **Admin View Phase** ✅
   - Admin sees "View Payment Proof" button
   - Button toggles proof visibility
   - Image loads correctly
   - No console errors or 404s

3. **Resubmission Phase** ✅
   - Users can resubmit after rejection
   - New proof file saved with unique name
   - Admin sees latest proof immediately
   - Old proof still on disk (can be deleted in cleanup script)

4. **Performance** ✅
   - Image loads within 2 seconds
   - No memory leaks from file uploads
   - /uploads directory stays reasonable size

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Test with Docker to ensure /uploads volume mounts correctly
- [ ] Verify file permissions in container (Node.js user can write)
- [ ] Set up automated cleanup of rejected/old proofs
- [ ] Configure S3/CloudStorage for scalability (optional but recommended)
- [ ] Verify nginx/reverse proxy configured to serve /uploads correctly
- [ ] Set up backup strategy for payment proofs
- [ ] Monitor /uploads directory disk usage
- [ ] Test payment proof re-upload flow end-to-end
- [ ] Verify admin panel shows all payment proofs correctly
