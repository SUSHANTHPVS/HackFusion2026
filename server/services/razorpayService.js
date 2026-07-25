import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET
});

export async function createOrder(amount) {
  return razorpay.orders.create({ amount: amount * 100, currency: "INR" });
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(payload).digest("hex");
  return expected === signature;
}

export function verifyRazorpayWebhookSignature(rawBody, signature) {
  if (!signature || !env.RAZORPAY_WEBHOOK_SECRET) {
    return false;
  }

  const expected = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  return expected === signature;
}
