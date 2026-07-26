import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new AppError("Razorpay credentials not configured", 500);
    }
    razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
};

export const createOrder = async ({ amount, receipt, notes = {}, currency = "INR" }) => {
  assertCredentials();

  const normalizedReceipt = String(receipt || "").trim();
  if (!normalizedReceipt) {
    throw new AppError("Receipt is required", 400);
  }

  if (normalizedReceipt.length > 40) {
    throw new AppError("Receipt must be 40 characters or fewer", 400);
  }

  try {
    const razorpayInstance = getRazorpayInstance();
    const order = await razorpayInstance.orders.create({
      amount,
      currency,
      receipt: normalizedReceipt,
      notes
    });

    return order;
  } catch (error) {
    const razorpayErrorDetails = [
      error?.message,
      error?.description,
      error?.error?.description,
      error?.error?.message,
      error?.response?.data?.error?.description,
      error?.response?.data?.error?.message,
      error?.response?.data?.message
    ]
      .filter(Boolean)
      .join(" | ");

    console.error("Razorpay order creation failed", {
      statusCode: error?.statusCode || error?.response?.status,
      code: error?.code,
      description: error?.description,
      response: error?.response?.data,
      rawError: error
    });

    if (error?.statusCode === 401 || /auth|unauthoriz|credential/i.test(error?.message || "")) {
      throw new AppError("Razorpay authentication failed", 401);
    }

    throw new AppError(
      `Failed to create Razorpay order${razorpayErrorDetails ? `: ${razorpayErrorDetails}` : ""}`,
      500
    );
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
