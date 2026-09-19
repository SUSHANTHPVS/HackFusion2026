# WhatsApp Business API Setup & Integration Guide

## Overview
This guide walks you through setting up Meta's WhatsApp Business API to send automated messages to hackathon participants with their WhatsApp numbers registered during signup.

---

## **Prerequisites**

✅ Meta Business Account (create at https://business.facebook.com)
✅ WhatsApp Business Account (free)
✅ Participants' phone numbers stored in database
✅ Environment configuration capability

---

## **Step-by-Step Setup**

### **Step 1: Create Meta Business Account**

1. Go to https://business.facebook.com
2. Click "Create Account"
3. Fill in business details:
   - Business name
   - Business email
   - Business phone
   - Country/Region
4. Complete verification

### **Step 2: Create WhatsApp Business Account**

1. In Business Manager, go to **Apps**
2. Click **Create App** → Select **Business**
3. Fill in app details:
   - App name: "IEEE Hackathon WhatsApp API"
   - App purpose: "Business Management"
4. Complete setup
5. Add **WhatsApp** product to your app

### **Step 3: Get WhatsApp Business Phone Number**

**Option A: Use a Verified Business Number**
1. In WhatsApp Manager, click **Phone Numbers**
2. Click **Add Phone Number**
3. Add your business phone number
4. Verify via SMS or call
5. Accept WhatsApp Business terms

**Option B: Request a Test Phone Number**
1. In App Dashboard, go to **WhatsApp** → **Getting Started**
2. Request test number (for development/testing)
3. Use for free during testing

### **Step 4: Generate System User Access Token**

1. Go to Business Settings → **Users**
2. Click **System Users**
3. Click **Create System User**
   - Name: "WhatsApp API Bot"
   - Role: "Admin"
4. After creation, click **Generate New Token**
   - Select apps: Your WhatsApp app
   - Token expires: Never (or set expiration)
5. **Copy the token** (store securely)

### **Step 5: Get Your Phone Number ID**

1. Go to WhatsApp Manager → **Phone Numbers**
2. Select your business phone number
3. Copy the **Phone Number ID** (looks like: 108231234567890)

### **Step 6: Get Business Account ID**

1. Go to WhatsApp Manager → **Account Settings**
2. Copy the **WhatsApp Business Account ID** (looks like: 113455129876543)

---

## **Configuration**

### **.env File Setup**

Add these variables to your `.env` file:

```env
# WhatsApp Business API Configuration
WHATSAPP_BUSINESS_API_TOKEN=your_system_user_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
ENABLE_WHATSAPP_BUSINESS_API=true
```

**Example:**
```env
WHATSAPP_BUSINESS_API_TOKEN=EAACEC8FZBqDUBAPZBpKZCZA7HB...
WHATSAPP_PHONE_NUMBER_ID=108231234567890
WHATSAPP_BUSINESS_ACCOUNT_ID=113455129876543
ENABLE_WHATSAPP_BUSINESS_API=true
```

### **Verify Configuration**

After setting env variables, restart your server. Check admin panel:
- Admin → WhatsApp Business API → "Check Credentials"
- Should show: ✅ Valid credentials

---

## **How to Use**

### **Admin Interface Workflow**

1. **Log in to Admin Dashboard**
2. **Navigate to**: Admin Panel → WhatsApp Business API
3. **View Participants**:
   - Lists all approved participants with phone numbers
   - Shows team names and participation type
4. **Select Recipients**:
   - Check boxes to select who gets message
   - Click "Select All" to message everyone
   - Shows count: "X of Y selected"
5. **Compose Message**:
   - Edit message content (default provided)
   - Character count shown (max 4096)
6. **Send**:
   - Click "Send Messages to X Recipients"
   - Real-time feedback on success/failures
   - Results show delivery status per recipient

### **API Endpoints**

**Get Participants for WhatsApp**
```
GET /api/admin/whatsapp/participants
Authorization: Bearer <token>

Response:
{
  "total": 45,
  "participants": [
    {
      "name": "John Doe",
      "mobile": "+919876543210",
      "email": "john@example.com",
      "teamName": "Team Alpha",
      "participationType": "team",
      "isTeamLeader": true
    },
    ...
  ]
}
```

**Send Messages**
```
POST /api/admin/whatsapp/send
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "recipientMobiles": ["+919876543210", "+918765432109"],
  "message": "Your message text here"
}

Response:
{
  "message": "WhatsApp messages sent",
  "totalRequests": 2,
  "successful": 2,
  "failed": 0,
  "summary": "Sent 2 messages successfully, 0 failed",
  "results": [
    {
      "success": true,
      "messageId": "wamid.HBE...",
      "phoneNumber": "+919876543210"
    }
  ]
}
```

**Check Credentials**
```
GET /api/admin/whatsapp/check-credentials
Authorization: Bearer <token>

Response:
{
  "configured": true,
  "valid": true,
  "phoneNumberId": "108231234567890",
  "displayPhone": "+919876543210",
  "qualityRating": "GREEN"
}
```

---

## **Pricing & Rate Limits**

### **Cost Structure**

| Region | Price per Message | Notes |
|--------|-----------------|-------|
| India | ₹0.50 - ₹1 | Domestic rates |
| International | $0.01 - $0.10 | Varies by country |

**Monthly Estimate:**
- 100 participants × ₹0.75 = ₹75/month
- 500 participants × ₹0.75 = ₹375/month

### **Rate Limits**

- **Tier 1**: 1 message/second (default)
- **Tier 2**: 80 messages/second (with approval)
- **Batch Size**: Max 100 recipients per API request
- **Implementation**: Auto-batched with 1-second delay between batches

### **Account Quality Rating**

Monitor your account quality in WhatsApp Manager:
- **GREEN**: Good standing ✅
- **YELLOW**: Moderate ⚠️
- **RED**: At risk ❌

Quality affects rate limits and pricing tiers.

---

## **Message Templates (Optional)**

For better compliance and cheaper rates, use WhatsApp pre-approved message templates:

### **Create Template**

1. In WhatsApp Manager → **Message Templates**
2. Click **Create Template**
3. Fill details:
   - Name: `hackathon_group_link`
   - Category: `MARKETING`
   - Language: `English`
   - Content:
     ```
     🎉 Join the IEEE Hackathon 2026 WhatsApp Group!
     
     {{1}}
     
     📱 Get updates, announcements, and connect with other participants. 
     See you at the hackathon! 🚀
     ```
4. Submit for approval (usually 24 hours)
5. Once approved, use `sendWhatsAppTemplateMessage` function

**Benefits:**
- ₹0.20-0.50 per message (cheaper)
- Better deliverability
- Compliant with WhatsApp policies

---

## **Security Best Practices**

✅ **DO:**
- Store token securely in .env (never commit to git)
- Use System User tokens (not personal tokens)
- Rotate tokens periodically (monthly)
- Enable IP whitelist in Business Manager
- Log all message sends for compliance
- Use templates for marketing messages
- Respect opt-out requests

❌ **DON'T:**
- Share token in logs or error messages
- Use test tokens in production
- Send unsolicited messages (spam)
- Store tokens in comments or documentation
- Use personal phone numbers
- Exceed rate limits intentionally
- Send messages without user consent

---

## **Troubleshooting**

### **"Invalid Access Token"**
- ✅ Verify token is correct in .env
- ✅ Check token hasn't expired
- ✅ Regenerate token in Business Manager
- ✅ Ensure System User still has permissions

### **"Invalid Phone Number ID"**
- ✅ Verify Phone Number ID is correct
- ✅ Ensure phone number is verified in WhatsApp Manager
- ✅ Check phone number status is "ACTIVE"

### **"Rate Limit Exceeded"**
- ✅ Wait before sending next batch
- ✅ Request higher tier from Meta
- ✅ Check account quality rating
- ✅ Reduce batch size

### **Messages Not Delivering**
- ✅ Check recipient phone number format (+country_code number)
- ✅ Verify recipient has WhatsApp installed
- ✅ Check account quality rating (GREEN)
- ✅ Ensure message content complies with policies

### **Credentials Check Shows "Not Configured"**
- ✅ Verify all 3 env variables are set
- ✅ Restart server after changing .env
- ✅ Check server logs for errors
- ✅ Regenerate and update token

---

## **Use Cases**

### **Scenario 1: Announce Winner**
```
Message: "🏆 Congratulations! You're a finalist in IEEE Hackathon 2026! 
Join our group for final details: [link]"

Usage:
1. Admin selects top teams
2. Composes congratulations message
3. Sends via WhatsApp API
4. Teams notified instantly
```

### **Scenario 2: Event Reminder**
```
Message: "⏰ Reminder: IEEE Hackathon starts in 2 hours! 
📍 Venue: [Location]
🔗 Group: [Link]"

Usage:
1. Day of event, admin selects all participants
2. Sends reminder message
3. Everyone gets notification via WhatsApp
```

### **Scenario 3: Emergency Updates**
```
Message: "🚨 Important: Venue changed to Building B! 
Check email for details: [Link]"

Usage:
1. Admin gets update from organizers
2. Quickly selects all registered teams
3. Sends update via WhatsApp (fastest)
4. Follows up with email
```

---

## **Monitoring & Analytics**

### **Track Message Delivery**

All sends are logged. View in admin dashboard:
- Total sent vs delivered
- Success rate percentage
- Delivery status per recipient
- Timestamps and message IDs

### **Webhook Integration (Advanced)**

Meta can send webhooks for delivery status:
- Message delivered
- Message read
- Message failed
- Status: webhook support coming soon

---

## **Migration from Manual Method**

**Before (Manual)**:
- Admin copies link manually
- Pastes in personal WhatsApp
- Manually selects recipients
- Sends one by one
- ⏱️ Time: 30+ minutes for 100 people

**After (WhatsApp Business API)**:
- Admin opens admin interface
- Clicks "Select All"
- Clicks "Send"
- Messages sent to 100 people in seconds
- ⏱️ Time: 2 minutes

**Cost Trade-off:**
- Manual: Free but slow and error-prone
- API: ₹0.50-1 per message but fast and reliable
- 100 participants = ~₹50-100 per announcement

---

## **Links & Resources**

- **Meta Business Manager**: https://business.facebook.com
- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **WhatsApp Business Phone**: https://www.whatsapp.com/business/
- **Message Templates**: https://www.whatsapp.com/business/api/templates/
- **Rate Limits**: https://developers.facebook.com/docs/whatsapp/cloud-api/rateLimits

---

## **Support**

❓ For issues:
1. Check server logs: `npm run dev` and check console output
2. Verify all env variables are set correctly
3. Regenerate access token in Meta Business Manager
4. Check WhatsApp Business Account status (active/suspended)
5. Review Meta's official documentation

---

**Version**: 1.0  
**Last Updated**: 2026-09-19  
**Status**: ✅ Ready for Production
