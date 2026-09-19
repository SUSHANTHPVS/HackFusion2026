# Render Disk Setup for Payment Proof Images

## Problem
Payment proof images are uploaded but don't persist on Render because the server's filesystem is ephemeral (deleted on restart).

## Solution
Add a persistent disk to your Render service to store uploaded payment proof images.

---

## ✅ Step-by-Step Setup

### Step 1: Go to Render Dashboard
1. Navigate to https://dashboard.render.com
2. Select your **Backend Service** (the Node.js app)
3. Click **Settings**

### Step 2: Add Persistent Disk
1. Scroll down to **"Disks"** section
2. Click **"Add Disk"**
3. Fill in these EXACT values:
   ```
   Name:       uploads
   Size:       1 GB
   Mount Path: /var/www/uploads
   ```
   ⚠️ **IMPORTANT:** Mount Path MUST be `/var/www/uploads`
4. Click **"Add Disk"** button
5. **Wait for dialog to close**

### Step 3: Verify Disk Configuration
After adding disk, you should see:
```
Name: uploads
Size: 1 GB
Mount Path: /var/www/uploads
```

### Step 4: Redeploy Service
1. Go to **"Deploys"** tab
2. Click **"Deploy latest commit"** (or "Manual Deploy")
3. **Wait for deployment to complete** (usually 2-5 minutes)
4. Check deployment logs for:
   ```
   [Upload] ✓ Upload directory exists
   [Upload] ✓ Directory is writable
   ```

### Step 5: Test Upload
1. Go to your app
2. Upload a payment proof image
3. Check **Render Logs** for messages like:
   ```
   [Upload] ✓ Upload directory exists: /var/www/uploads/payment-proofs
   [Upload] ✓ Directory is writable
   [submitManualPaymentProof] ✓ File verified on disk
   ```
4. Go to Payment Verification page
5. Click "View Payment Proof"
6. **Image should load now!** ✓

---

## 🔍 Troubleshooting

### Issue: Image still won't load
**Check the logs:**
1. Go to Render Dashboard → Your Service → Logs
2. Look for these messages:
   ```
   ✓ Upload directory exists
   ✓ Directory is writable
   ✓ File verified on disk
   ```

**If you see errors instead:**
```
✗ Directory exists but NOT writable
```
→ Your disk mount path is wrong. Delete disk and re-add with `/var/www/uploads`

### Issue: 404 Error (file not found)
**This means:**
- Disk wasn't added properly
- Mount path was wrong
- Service wasn't redeployed after adding disk

**Fix:**
1. Delete the disk
2. Add it again with correct path: `/var/www/uploads`
3. Redeploy
4. Test again

### Issue: Upload succeeds but image 404 on load
**This could mean:**
- Files are being saved to wrong location
- Server not restarted after disk added

**Check:**
1. Go to Render Logs
2. Look for: `[Upload] Upload directory: `/var/www/uploads/payment-proofs``
3. If it shows different path, add this environment variable:
   - Key: `RENDER_UPLOADS_DIR`
   - Value: (your actual mount path)
4. Redeploy and test

---

## 📋 Verification Checklist

Before uploading payment proofs, verify:

- [ ] Disk added to Render service (Name: uploads, Mount: /var/www/uploads)
- [ ] Service redeployed after adding disk
- [ ] Render logs show: `✓ Upload directory exists`
- [ ] Render logs show: `✓ Directory is writable`
- [ ] Test file uploads successfully
- [ ] Image loads in Payment Verification page

---

## 🚀 Expected Behavior After Setup

1. **User uploads payment proof** → File saved to persistent disk
2. **Page refreshes** → File still there ✓
3. **Service restarts** → File still there ✓
4. **Multiple users upload files** → All files persist ✓

---

## Important Notes

- Disk size 1GB can hold ~500 payment proofs (typical image ~2MB)
- Files persist even if service restarts or redeploys
- CORS headers are configured to allow image loading
- Upload directory is created automatically if missing
- File upload verification ensures image was actually saved

---

## Still Not Working?

If images still won't load after following these steps:

1. **Check Render disk exists:**
   - Render Dashboard → Settings → Disks → Should show "uploads" disk

2. **Check mount path:**
   - Should be exactly: `/var/www/uploads`

3. **Check service redeployed:**
   - Go to Deploys tab → Most recent should be after disk added

4. **Check logs for errors:**
   - Look for: `✗ Error creating directory` or `✗ NOT writable`

5. **Force redeploy:**
   - Click "Manual Deploy" to force redeploy without code changes

---

## File Structure on Render

After setup, your disk structure looks like:
```
/var/www/uploads/
├── payment-proofs/
│   ├── paymentproof_1789820756503_15lfih.jpg
│   ├── paymentproof_1789820804192_abc123.png
│   └── ... (more payment proofs)
```

All files in this directory persist across restarts!
