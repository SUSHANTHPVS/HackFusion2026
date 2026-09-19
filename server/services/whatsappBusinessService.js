import axios from "axios";
import env from "../config/env.js";

/**
 * WhatsApp Business API Service
 * Handles sending messages via Meta's WhatsApp Business API
 * 
 * Setup Required:
 * 1. Create Meta Business Account
 * 2. Get WhatsApp Business Account ID
 * 3. Generate System User Access Token
 * 4. Add phone numbers to template or use direct messaging
 * 5. Set environment variables
 */

const WHATSAPP_API_URL = "https://graph.instagram.com/v20.0";

/**
 * Send WhatsApp message to a single participant
 * @param {string} recipientPhoneNumber - Phone number with country code (e.g., +919876543210)
 * @param {string} message - Message text to send
 * @returns {Promise<Object>} API response with message ID
 */
export const sendWhatsAppMessage = async (recipientPhoneNumber, message) => {
  try {
    const payload = {
      messaging_product: "whatsapp",
      to: recipientPhoneNumber,
      type: "text",
      text: {
        body: message
      }
    };

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_BUSINESS_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
      phoneNumber: recipientPhoneNumber,
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`Failed to send WhatsApp to ${recipientPhoneNumber}:`, error.response?.data || error.message);
    return {
      success: false,
      phoneNumber: recipientPhoneNumber,
      error: error.response?.data?.error?.message || error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Send WhatsApp message to multiple participants
 * @param {Array<string>} phoneNumbers - Array of phone numbers with country code
 * @param {string} message - Message text to send
 * @returns {Promise<Object>} Summary of send results
 */
export const sendBulkWhatsAppMessages = async (phoneNumbers, message) => {
  try {
    const results = [];
    const batchSize = 10; // Send in batches to avoid rate limiting
    
    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batch = phoneNumbers.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(phoneNumber => sendWhatsAppMessage(phoneNumber, message))
      );
      
      results.push(...batchResults);
      
      // Add delay between batches (1 second) to respect rate limits
      if (i + batchSize < phoneNumbers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      totalRequests: results.length,
      successful,
      failed,
      results,
      summary: `Sent ${successful} messages successfully, ${failed} failed`
    };
  } catch (error) {
    console.error("Bulk WhatsApp send error:", error.message);
    throw error;
  }
};

/**
 * Send WhatsApp template message (pre-approved by Meta for better compliance)
 * @param {string} recipientPhoneNumber - Phone number with country code
 * @param {string} templateName - Name of approved template (e.g., "hackathon_group_link")
 * @param {Array<string>} parameters - Template parameters in order
 * @returns {Promise<Object>} API response
 */
export const sendWhatsAppTemplateMessage = async (recipientPhoneNumber, templateName, parameters = []) => {
  try {
    const payload = {
      messaging_product: "whatsapp",
      to: recipientPhoneNumber,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en_US"
        }
      }
    };

    // Add parameters if template uses them
    if (parameters.length > 0) {
      payload.template.components = [
        {
          type: "body",
          parameters: parameters.map(param => ({ type: "text", text: param }))
        }
      ];
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_BUSINESS_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
      phoneNumber: recipientPhoneNumber,
      template: templateName,
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`Failed to send template to ${recipientPhoneNumber}:`, error.response?.data || error.message);
    return {
      success: false,
      phoneNumber: recipientPhoneNumber,
      template: templateName,
      error: error.response?.data?.error?.message || error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Verify WhatsApp Business API credentials
 * @returns {Promise<boolean>} True if credentials are valid
 */
export const verifyWhatsAppCredentials = async () => {
  try {
    const response = await axios.get(
      `${WHATSAPP_API_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}`,
      {
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_BUSINESS_API_TOKEN}`
        }
      }
    );

    return {
      valid: true,
      phoneNumberId: response.data.id,
      displayPhone: response.data.display_phone_number,
      qualityRating: response.data.quality_rating
    };
  } catch (error) {
    console.error("WhatsApp credential verification failed:", error.response?.data || error.message);
    return {
      valid: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

export default {
  sendWhatsAppMessage,
  sendBulkWhatsAppMessages,
  sendWhatsAppTemplateMessage,
  verifyWhatsAppCredentials
};
