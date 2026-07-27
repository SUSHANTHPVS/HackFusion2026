/**
 * Sync payments with Razorpay after 2 days
 * Run this daily to reconcile payment statuses
 * Usage: node syncPaymentsWithRazorpay.js
 */

import mongoose from "mongoose";
import { Payment } from "../models/Payment.js";
import { fetchPaymentStatusFromRazorpay } from "../services/razorpayService.js";
import { logPaymentAudit } from "../services/paymentAuditService.js";
import { config } from "dotenv";

config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ MongoDB connected");
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const syncPaymentsWithRazorpay = async () => {
  console.log("[Sync] Starting Razorpay payment reconciliation...");

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  // Find all payments marked as success that were created 2+ days ago
  const paymentsToReconcile = await Payment.find({
    status: "success",
    paymentId: { $exists: true, $ne: null },
    createdAt: { $lt: twoDaysAgo }
  }).limit(100);

  console.log(`[Sync] Found ${paymentsToReconcile.length} payments to reconcile`);

  let verified = 0;
  let failed = 0;

  for (const payment of paymentsToReconcile) {
    try {
      const razorpayStatus = await fetchPaymentStatusFromRazorpay(payment.orderId);
      
      if (razorpayStatus === "paid") {
        verified++;
        console.log(`  ✓ ${payment.orderId} - Verified as paid on Razorpay`);
        
        await logPaymentAudit({
          paymentRef: payment._id,
          orderId: payment.orderId,
          userId: payment.userId,
          teamId: payment.teamId,
          eventType: "RAZORPAY_SYNC_VERIFIED",
          source: "cron",
          status: "success",
          message: "Payment verified with Razorpay after 2-day delay",
          payload: { razorpayStatus }
        });
      } else {
        failed++;
        // If Razorpay doesn't confirm as paid, mark as failed
        payment.status = "failed";
        await payment.save();
        
        console.log(`  ✗ ${payment.orderId} - Status on Razorpay: ${razorpayStatus}, marked as failed`);
        
        await logPaymentAudit({
          paymentRef: payment._id,
          orderId: payment.orderId,
          userId: payment.userId,
          teamId: payment.teamId,
          eventType: "RAZORPAY_SYNC_FAILED",
          source: "cron",
          status: "failed",
          message: `Razorpay confirmation failed after 2 days. Status: ${razorpayStatus}`,
          payload: { razorpayStatus }
        });
      }
    } catch (error) {
      console.error(`  ! Error syncing ${payment.orderId}:`, error.message);
      failed++;
    }
  }

  console.log(`[Sync] Complete - Verified: ${verified}, Failed: ${failed}`);
};

// Main
(async () => {
  await connectDB();
  await syncPaymentsWithRazorpay();
  await mongoose.connection.close();
  console.log("✓ Sync finished and connection closed");
})();
