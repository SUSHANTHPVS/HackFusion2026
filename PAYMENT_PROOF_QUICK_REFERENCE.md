# Payment Proof Feature - Quick Reference

## What Changed?
The Excel Format 1 export now includes **actual payment proof file paths** instead of placeholder text.

## Before vs After

### Before
```
Payment Proof: Online Payment
```

### After
```
Payment Method: ONLINE
Payment Proof: Online Payment
Payment Status: success
Amount (₹): 500
Order ID: order_12345
UTR / Transaction ID: txn_12345

--- OR for manual payments ---

Payment Method: MANUAL_BANK_TRANSFER
Payment Proof: uploads/payment-proofs/team-12345-proof.jpg
Payment Status: success
Amount (₹): 500
Order ID: RP_123456
UTR / Transaction ID: 123456789101
```

## New Excel Columns

| Column | Purpose |
|--------|---------|
| Payment Method | ONLINE, MANUAL_BANK_TRANSFER, CHEQUE |
| Payment Proof | File path to screenshot or "Online Payment" |
| Payment Status | success, failed, pending_verification |
| Amount (₹) | Amount paid in Rupees |
| Order ID | Razorpay or internal order ID |
| UTR / Transaction ID | Bank transfer UTR or payment ID |

## How to View Payment Proof Screenshots

### Step 1: Download Format 1 Excel
- Click "Format 1 (Complete)" button in Admin Registrations page
- Opens `hackfusion-team-information.xlsx`

### Step 2: Find the Team Row
- Locate the team by name or search

### Step 3: Get File Path
- Look at "Payment Proof" column
- For online payments: Shows "Online Payment"
- For manual payments: Shows `uploads/payment-proofs/team-123.jpg`

### Step 4: View the Screenshot
**Option A - Web Browser:**
```
https://your-domain.com/uploads/payment-proofs/team-123.jpg
```

**Option B - File Manager:**
```
Navigate to: server/uploads/payment-proofs/team-123.jpg
```

**Option C - Admin Dashboard:**
```
Go to Payment Verification section and view linked screenshot
```

## File Location
```
Your-Project/
└── server/
    └── uploads/
        └── payment-proofs/
            ├── team-12345-proof.jpg
            ├── team-67890-proof.png
            ├── team-11111-cheque-proof.jpg
            └── ... (more payment proofs)
```

## Payment Method Legend

| Status | Meaning |
|--------|---------|
| ONLINE | Razorpay payment (auto-verified) |
| MANUAL_BANK_TRANSFER | Manual bank transfer with proof |
| CHEQUE | Cheque payment with proof |
| [method] (No Proof Submitted) | Manual payment but no screenshot uploaded |

## Common File Paths

**Online Payment:**
```
Payment Proof: Online Payment
```

**Manual Bank Transfer with Proof:**
```
Payment Proof: uploads/payment-proofs/team-001-proof.jpg
```

**Cheque with Proof:**
```
Payment Proof: uploads/payment-proofs/team-002-cheque-proof.png
```

**Manual Payment - No Proof:**
```
Payment Proof: MANUAL_BANK_TRANSFER (No Proof Submitted)
```

## Verifying Payments

### Audit Checklist
- [ ] Download Format 1 Excel
- [ ] Check "Payment Method" column
- [ ] For manual payments, verify file path in "Payment Proof" column
- [ ] Open screenshot to verify payment details
- [ ] Cross-check with bank statement (use "UTR / Transaction ID" column)
- [ ] Verify "Amount (₹)" matches bank records
- [ ] Check "Payment Status" is "success"

## Support

**Q: I see "Online Payment" - what does that mean?**
A: The payment was processed through Razorpay and automatically verified. No manual proof needed.

**Q: I see a file path - how do I view it?**
A: Copy the path like `uploads/payment-proofs/team-123.jpg` and:
1. Add your domain: `https://your-domain.com/uploads/payment-proofs/team-123.jpg`
2. OR access directly from file system: `server/uploads/payment-proofs/team-123.jpg`

**Q: Why does a team show "No Proof Submitted"?**
A: They selected manual bank transfer but didn't upload a screenshot. Contact them to provide proof.

**Q: Can I see these proofs in the admin dashboard too?**
A: Yes! Go to the Payment Verification page in admin dashboard to view proofs directly.

---

**Feature Status:** ✅ Active
**Last Updated:** Payment Proof Excel Export Enhanced
