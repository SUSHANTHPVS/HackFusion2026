import crypto from "crypto";
import { env } from "../config/env.js";

const PHONEPE_BASE_URL =
  env.NODE_ENV === "production"
    ? "https://api.phonepe.com/apis/pg"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";

function sha256Hex(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Initiate a payment with PhonePe Pay Page.
 * @param {Object} params
 * @param {string} params.merchantTransactionId - Unique transaction ID for this order
 * @param {number}  params.amount - Amount in INR (whole number)
 * @param {string} params.userId - User's DB ID (used as merchantUserId)
 * @param {string} params.redirectUrl - Client URL PhonePe redirects to after payment
 * @param {string} params.callbackUrl - Server URL PhonePe POSTs the result to
 * @returns {{ merchantTransactionId: string, redirectUrl: string }}
 */
export async function initiatePayment({ merchantTransactionId, amount, userId, redirectUrl, callbackUrl }) {
  const payload = {
    merchantId: env.PHONEPE_MERCHANT_ID,
    merchantTransactionId,
    merchantUserId: String(userId),
    amount: amount * 100, // convert INR → paise
    redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl,
    paymentInstrument: {
      type: "PAY_PAGE"
    }
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const endpoint = "/pg/v1/pay";
  const xVerify = sha256Hex(base64Payload + endpoint + env.PHONEPE_SALT_KEY) + "###" + env.PHONEPE_SALT_INDEX;

  const response = await fetch(`${PHONEPE_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
      "X-MERCHANT-ID": env.PHONEPE_MERCHANT_ID
    },
    body: JSON.stringify({ request: base64Payload })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "PhonePe payment initiation failed");
  }

  return {
    merchantTransactionId,
    redirectUrl: data.data.instrumentResponse.redirectInfo.url
  };
}

/**
 * Check the payment status for a transaction from PhonePe.
 * @param {string} merchantTransactionId
 * @returns {Object} PhonePe status response
 */
export async function checkPaymentStatus(merchantTransactionId) {
  const endpoint = `/pg/v1/status/${env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
  const xVerify = sha256Hex(endpoint + env.PHONEPE_SALT_KEY) + "###" + env.PHONEPE_SALT_INDEX;

  const response = await fetch(`${PHONEPE_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
      "X-MERCHANT-ID": env.PHONEPE_MERCHANT_ID
    }
  });

  return response.json();
}

/**
 * Verify the X-VERIFY header from a PhonePe server-to-server callback.
 * PhonePe sends: X-VERIFY = sha256(response_base64 + saltKey) + "###" + saltIndex
 * where response_base64 is the `response` field in the request body.
 * @param {string} responseBase64 - The `response` field from PhonePe callback body
 * @param {string} xVerifyHeader - The X-VERIFY header value
 * @returns {boolean}
 */
export function verifyPhonePeCallback(responseBase64, xVerifyHeader) {
  if (!xVerifyHeader || !responseBase64 || !env.PHONEPE_SALT_KEY) {
    return false;
  }
  const expected = sha256Hex(responseBase64 + env.PHONEPE_SALT_KEY) + "###" + env.PHONEPE_SALT_INDEX;
  return expected === xVerifyHeader;
}
