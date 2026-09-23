# Payment Proof Excel Export Guide

## Overview
The Format 1 Excel export now includes **actual payment proof file paths** for manual bank transfers and cheque payments. Online payments continue to show "Online Payment" (as they are verified directly by Razorpay).

## What's New in Format 1 Export

### New Columns Added
| Column | Purpose |
|--------|---------|
| Payment Method | Shows the payment method used (ONLINE, MANUAL_BANK_TRANSFER, CHEQUE, etc.) |
| Payment Proof | File path to the uploaded screenshot OR "Online Payment" for Razorpay payments |
| Payment Status | success, failed, pending_verification |
| Amount (₹) | Payment amount in Indian Rupees |
| Order ID | Razorpay Order ID or internal reference |
| UTR / Transaction ID | UTR number for bank transfers or Razorpay transaction ID |

### Payment Proof Field Examples

#### Online Payments (Razorpay)
```
Payment Method: ONLINE
Payment Proof: Online Payment
Payment Status: success
```

#### Manual Bank Transfers
```
Payment Method: MANUAL_BANK_TRANSFER
Payment Proof: uploads/payment-proofs/team-12345-proof.jpg
Payment Status: success
UTR / Transaction ID: 123456789101
```

#### Cheque Payments
```
Payment Method: CHEQUE
Payment Proof: uploads/payment-proofs/team-98765-cheque-proof.png
Payment Status: pending_verification
UTR / Transaction ID: [blank]
```

## How to Access Payment Proof Screenshots

### Method 1: Using File Server
1. Take the file path from the "Payment Proof" column
   - Example: `uploads/payment-proofs/team-12345-proof.jpg`

2. Navigate to your server's file system:
   ```
   Your-Server/uploads/payment-proofs/team-12345-proof.jpg
   ```

3. View the uploaded payment screenshot

### Method 2: Using Web Browser
1. Construct the full URL using your domain:
   ```
   https://your-hackfusion-domain.com/uploads/payment-proofs/team-12345-proof.jpg
   ```

2. Open the URL in a web browser to view the screenshot

### Method 3: Using Admin Dashboard
1. Log in to the admin dashboard
2. Go to Registrations or Payment Management section
3. Find the team and click on the payment proof link
4. View the screenshot in the payment verification modal

## File Organization

All payment proof screenshots are stored in:
```
server/uploads/payment-proofs/
```

File naming convention:
- `team-{teamId}-proof.{extension}` (for manual proofs)
- `team-{teamId}-cheque-proof.{extension}` (for cheque proofs)
- Common extensions: `.jpg`, `.jpeg`, `.png`, `.gif`

## Usage Scenarios

### Scenario 1: Verify Payment for a Specific Team
1. Export Format 1 Excel
2. Find the team row by name
3. Look at "Payment Proof" column
4. If it shows a file path like `uploads/payment-proofs/team-123.jpg`:
   - Copy the path
   - Open it in your file manager or web browser
   - Verify the payment details in the screenshot

### Scenario 2: Audit All Manual Payments
1. Export Format 1 Excel
2. Filter or sort by "Payment Method" column = "MANUAL_BANK_TRANSFER"
3. For each row, check the "Payment Proof" column for file paths
4. Verify each screenshot against the payment details in your bank statement
5. Cross-check with "Amount (₹)" and "UTR / Transaction ID" columns

### Scenario 3: Find Pending Payment Verifications
1. Export Format 1 Excel
2. Filter "Payment Status" column for "pending_verification"
3. View the corresponding payment proof screenshots
4. Approve or reject the payment based on the screenshot evidence

## Troubleshooting

### Issue: "Payment Proof" shows "No Proof Submitted"
- **Reason:** Team paid via manual method but didn't upload a screenshot
- **Action:** Contact the team to upload the proof, or accept based on bank statement verification
- **Column shows:** `MANUAL_BANK_TRANSFER (No Proof Submitted)`

### Issue: "Payment Proof" shows "Online Payment"
- **Reason:** Payment was processed through Razorpay (automatic verification)
- **Action:** No manual verification needed; Razorpay has already verified the payment
- **Column shows:** `Online Payment`

### Issue: File path is broken or file doesn't exist
- **Reason:** File may have been deleted or server path changed
- **Action:** 
  1. Check if file exists in `uploads/payment-proofs/` directory
  2. Verify the server configuration
  3. Check the database for the correct file path in Payment model

### Issue: Unable to view the screenshot
- **Reason:** 
  1. File permissions issue
  2. Web server not configured to serve uploads directory
  3. File path incomplete or incorrect
  
- **Action:**
  1. Verify file exists in `server/uploads/payment-proofs/`
  2. Check nginx.conf or web server configuration
  3. Ensure static file serving is enabled for `/uploads/` path
  4. Use direct file system access instead

## Data Structure

### Backend Changes (adminController.js)
- Updated `searchRegistrations` endpoint to fetch:
  - `paymentMethod` (from Payment model)
  - `paymentProofFile` (from Payment model)
  - `paymentProofSubmittedAt` (from Payment model)
  - `paymentApprovedAt` (from Payment model)
  - `utrNumber` (from Payment model)
  - `transactionId` (from Payment model)

### Frontend Changes (AdminRegistrationsPage.jsx)
- Enhanced `buildFormat1ExportRows` function to:
  - Check payment method and determine proof display
  - For manual payments: Show file path if available, else show "No Proof Submitted"
  - For online payments: Show "Online Payment"
  - Include all payment details columns

## Security Notes

1. **File Permissions:** Ensure uploaded files are not accidentally exposed to unauthorized users
2. **Sensitive Data:** Payment proof screenshots may contain sensitive banking information
3. **Access Control:** Only admins should have access to this Excel export
4. **Data Retention:** Implement appropriate retention policies for payment proof files

## Excel Column Reference

| Column Name | Type | Example |
|-------------|------|---------|
| S.No | Number | 1, 2, 3 |
| Team Name | Text | "Team AlphaX" |
| Problem Statement (Theme) | Text | "AI for Social Good" |
| Participant Names | Text | "Alice, Bob, Carol" |
| Roll Numbers | Text | "CSE001, CSE002, CSE003" |
| Email IDs | Text | "alice@college.edu, bob@college.edu" |
| Branches | Text | "CSE, CSE, ECE" |
| Sections | Text | "A, A, B" |
| College Name | Text | "XYZ Engineering College" |
| Payment Method | Text | "ONLINE", "MANUAL_BANK_TRANSFER", "CHEQUE" |
| Payment Proof | Text | "Online Payment" OR "uploads/payment-proofs/..." |
| Payment Status | Text | "success", "failed", "pending_verification" |
| Amount (₹) | Number | 500, 1000, 2000 |
| Order ID | Text | "order_12345", "RP_123456" |
| UTR / Transaction ID | Text | "123456789101", "txn_12345" |

---

**Last Updated:** Enhanced with payment proof screenshot file paths
**Status:** All payment proof screenshots now accessible from Excel export
