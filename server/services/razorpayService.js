import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET
});

export const createOrder = async ({ amount, receipt, notes = {} }) => {
  assertCredentials();

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt,
      notes
    });

    return order;
  } catch (error) {
    throw new AppError(`Failed to create Razorpay order: ${error.message}`, 500);
  }
};

export const verifyPaymentSignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  assertCredentials();

  const generatedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const isValid = generatedSignature === razorpay_signature;

  if (!isValid) {
    throw new AppError("Invalid payment signature", 400);
  }

  return true;
};

const assertCredentials = () => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(
      "Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      500
    );
  }
};
