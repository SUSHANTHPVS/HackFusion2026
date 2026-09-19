# Payment Proof Image - Debugging Guide

## Quick Diagnosis Flowchart

```
File uploads successfully?
├─ NO  → Check browser console for upload errors
│        → Check server logs for file size errors
│
├─ YES → Image appears in DB?
         ├─ NO  → Database save issue
         │
         ├─ YES → Image loads in admin preview?
                  ├─ YES on localhost → Render disk not configured!
                  │                  → Follow RENDER_DISK_SETUP.md
                  │
                  ├─ NO on localhost  → CORS or path issue
                  │                  → Check browser console errors
                  │
                  ├─ YES on localhost but NO on Render → Files not persisting
                                                       → Add Render disk!
```

---

## 🔍 Detailed Debugging Steps

### 1. Check Upload Success

**Frontend (Browser Console)**
```javascript
// When uploading payment proof, look for:
"Payment proof submitted successfully"
// Instead of:
"File upload failed"
```

**Backend Logs (Render Dashboard → Logs)**
```
[submitManualPaymentProof] ✓ File verified on disk
```

---

### 2. Verify File in Database

**MongoDB Query:**
```javascript
// In MongoDB compass or similar
db.payments.findOne({ 
  userId: "your_user_id" 
}, { 
  paymentProofFile: 1 
})

// Should show:
{
  "_id": ObjectId,
  "paymentProofFile": "/uploads/payment-proofs/paymentproof_1789820756503_15lfih.jpg"
}
```

---

### 3. Check Admin Payment Verification Page

**In Admin Dashboard:**
1. Go to "Payment Verification" page
2. Find the payment you just uploaded
3. Click payment card
4. Look for one of three states:

**State A: ✓ Image loads**
```
- Image thumbnail visible
- Can click and preview
- Everything works!
```

**State B: ✗ Shows red error icon**
```
- Message: "Failed to load payment proof image"
- Shows file path: /uploads/payment-proofs/paymentproof_XXX.jpg
- Shows URL: https://hackfusion2026.onrender.com/uploads/payment-proofs/...
```
→ **Problem:** File not found or CORS issue

**State C: ⚠️ Empty/blank**
```
- No image, no error
- Blank space
- Console shows 404 error
```
→ **Problem:** File path wrong or not persisting

---

### 4. Check Server Logs

**Render Dashboard → Logs → Search for "Upload"**

#### ✅ Good Signs:
```
[Upload] Upload directory: /var/www/uploads/payment-proofs
[Upload] ✓ Upload directory exists
[Upload] ✓ Directory is writable
[submitManualPaymentProof] ✓ File verified on disk
```

#### ❌ Bad Signs:
```
[Upload] ✗ Directory exists but NOT writable
```
→ Disk mount path wrong

```
[submitManualPaymentProof] ✗ CRITICAL ERROR: File NOT saved to disk!
```
→ Directory not writable or doesn't exist

```
[submitManualPaymentProof] ✗ Expected path: /var/www/uploads/payment-proofs/...
```
→ File not found on disk

---

### 5. Check Browser Network Tab

**To see exact error:**

1. Open browser DevTools (F12)
2. Go to "Network" tab
3. Upload a payment proof
4. Look for the image URL request
5. Check response:

**Status 200 (Good):**
- File loads successfully
- Response shows image data
- No CORS errors

**Status 404 (Bad):**
- File not found
- Render disk not configured
- Mount path wrong

**Status 403 (Bad):**
- Permission denied
- Disk not writable

**CORS Error:**
- Image blocked by browser
- Server not sending CORS headers
- (This is now fixed in code)

---

### 6. Manual File Verification

**If using SSH to Render container:**
```bash
# Connect to Render container (via SSH/terminal)
cd /var/www/uploads/payment-proofs

# List files
ls -lah

# Should show:
# -rw-r--r--  paymentproof_1789820756503_15lfih.jpg
# -rw-r--r--  paymentproof_1789820804192_abc123.png
# etc.

# Check if disk is mounted
df -h | grep uploads
# Should show: /var/www/uploads mounted with plenty of space
```

---

## 📊 Diagnosis Decision Tree

### Problem: "Image won't load on Render"

**Question 1: Does it work on localhost?**
- YES → Problem is Render-specific (disk/config issue)
  - Does Render disk exist? → Add it if missing
  - Is mount path correct? → Must be `/var/www/uploads`
  - Did you redeploy after adding disk? → Redeploy if not

- NO → Problem is code/CORS related
  - Check CORS headers in server.js (should be present now)
  - Check `crossOrigin="anonymous"` on img tag
  - Check file path format (should be `/uploads/payment-proofs/...`)

**Question 2: What error do you see?**
- 404 Not Found → File not saved or disk not mounted
- 403 Forbidden → Permissions issue on disk
- NET::ERR_BLOCKED_BY_RESPONSE → CORS issue (should be fixed)
- Blank/no error → Wrong path or file deleted on restart

**Question 3: Check server logs:**
```
[Upload] ✓ Upload directory exists       → Directory OK
[Upload] ✓ Directory is writable         → Permissions OK
[submitManualPaymentProof] ✓ File verified on disk  → File saved
```

If all ✓ but image still won't load:
- Clear browser cache (Ctrl+Shift+Del)
- Hard refresh page (Ctrl+Shift+R)
- Try different browser
- Check if disk full (1GB limit)

---

## 🛠️ Common Fixes

### Fix 1: Add Missing Render Disk
1. Render Dashboard → Your Service → Settings
2. Click "Add Disk"
3. Name: `uploads`
4. Mount Path: `/var/www/uploads`
5. Size: `1 GB`
6. Click Add
7. Redeploy service

### Fix 2: Wrong Mount Path
1. Delete current disk
2. Add new disk with correct path: `/var/www/uploads`
3. Redeploy

### Fix 3: Service Not Redeployed
1. Render Dashboard → Deploys
2. Click "Manual Deploy"
3. Wait for deployment to finish
4. Test again

### Fix 4: Disk Full
1. Check disk usage in Render logs
2. Delete old payment proofs (if needed)
3. Or upgrade disk size

### Fix 5: Cache Issues
1. Browser: Ctrl+Shift+Del → Clear all cache
2. Hard refresh: Ctrl+Shift+R
3. Try incognito window
4. Try different browser

---

## 📝 Sample Error Messages & Solutions

### Error: "Failed to load payment proof image"
**Message shown on admin page**
```
File: /uploads/payment-proofs/paymentproof_1789820756503_15lfih.jpg
URL: https://hackfusion2026.onrender.com/uploads/payment-proofs/paymentproof_1789820756503_15lfih.jpg
Status: Failed to load
```

**Solution:**
1. Check if Render disk added (Settings → Disks)
2. Check if service redeployed after adding disk
3. Check server logs for write errors
4. Try uploading new test file and check logs

### Error: "net::ERR_BLOCKED_BY_RESPONSE"
**Browser network tab shows:**
```
Status: 200
Type: image/jpeg
Size: 0 B
```

**Solution:**
- Should be fixed with new code
- Clear browser cache
- Hard refresh page
- Check server CORS headers

### Error: "404 File Not Found"
**Browser console shows:**
```
GET https://hackfusion2026.onrender.com/uploads/payment-proofs/... 404
```

**Solution:**
1. File not saved to disk (most likely)
2. Disk not mounted at `/var/www/uploads`
3. Check server logs for write errors

---

## ✅ Expected Log Output

**After uploading payment proof on Render, you should see:**

```
[Upload] ============================================
[Upload] Upload directory: /var/www/uploads/payment-proofs
[Upload] NODE_ENV: production
[Upload] ✓ Upload directory exists
[Upload] ✓ Directory is writable
[Upload] ============================================
[Upload] Processing file upload: paymentproof_1789820756503_15lfih.jpg
[Upload] File type approved: image/jpeg
[submitManualPaymentProof] ============================================
[submitManualPaymentProof] File Upload Details:
[submitManualPaymentProof] Original filename: payment_proof.jpg
[submitManualPaymentProof] Stored filename: paymentproof_1789820756503_15lfih.jpg
[submitManualPaymentProof] File path: /var/www/uploads/payment-proofs/paymentproof_1789820756503_15lfih.jpg
[submitManualPaymentProof] File size: 245678 bytes
[submitManualPaymentProof] MIME type: image/jpeg
[submitManualPaymentProof] Public URL: /uploads/payment-proofs/paymentproof_1789820756503_15lfih.jpg
[submitManualPaymentProof] ✓ File verified on disk
[submitManualPaymentProof] ✓ File size: 245678 bytes
[submitManualPaymentProof] ============================================
```

**If you see this, everything is working!**
- ✓ Disk configured correctly
- ✓ Directory writable
- ✓ File saved to disk
- ✓ File can now load in admin page

---

## Still Having Issues?

**1. Confirm Render disk exists:**
   - Dashboard → Settings → Disks → Should show "uploads" disk

**2. Confirm mount path:**
   - Should be: `/var/www/uploads` (NOT `/uploads` or `/app/uploads`)

**3. Confirm service redeployed:**
   - Deploys tab → Most recent should be after disk added

**4. Check logs for errors:**
   - Look for any `✗` or `Error` messages

**5. Force redeploy:**
   - Manual Deploy button (even if no code changed)

If still broken after these steps, the issue is likely with Render's disk configuration itself. Contact Render support with the log messages showing the exact error.
