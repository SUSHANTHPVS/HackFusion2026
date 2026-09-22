import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { env } from "../config/env.js";

const teamsToCheck = [
  "Hackx",
  "Codevision",
  "Tech titans",
  "Apexcode",
  "Apex",
  "Code catalysts",
  "Team errors"
];

async function freshDiagnostic() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("━".repeat(80));
    console.log("🔍 FRESH DIAGNOSTIC - Checking Current Database State");
    console.log("━".repeat(80) + "\n");

    for (const teamName of teamsToCheck) {
      console.log(`\n${"─".repeat(80)}`);
      console.log(`📋 Searching for: "${teamName}"`);
      console.log(`${"─".repeat(80)}`);

      // Try exact match first
      let team = await Team.findOne({ name: teamName });
      
      // If not found, try case-insensitive
      if (!team) {
        team = await Team.findOne({ name: { $regex: `^${teamName}$`, $options: "i" } });
      }

      // If still not found, try partial match
      if (!team) {
        team = await Team.findOne({ name: { $regex: teamName, $options: "i" } });
      }

      if (!team) {
        console.log(`❌ Team NOT found in database`);
        continue;
      }

      console.log(`✅ Team found: ${team.name} (ID: ${team._id})`);

      // Get ALL payments for this team
      const payments = await Payment.find({ teamId: team._id }).sort({ createdAt: -1 });
      console.log(`📊 Total payments: ${payments.length}`);

      if (payments.length === 0) {
        console.log(`⚠️  NO payments found`);
        continue;
      }

      // Show MOST RECENT payment (first one after sort)
      const latestPayment = payments[0];
      console.log(`\n🔴 LATEST Payment (Most Recent):`);
      console.log(`   Status: ${latestPayment.status}`);
      console.log(`   Amount: ${latestPayment.amount} ${latestPayment.currency}`);
      console.log(`   Method: ${latestPayment.paymentMethod}`);
      console.log(`   Order ID: ${latestPayment.orderId || "N/A"}`);
      console.log(`   Payment ID (Razorpay): ${latestPayment.paymentId || "N/A"}`);
      console.log(`   Signature: ${latestPayment.signature ? "✅ SET" : "❌ NOT SET"}`);
      console.log(`   Approved At: ${latestPayment.paymentApprovedAt ? new Date(latestPayment.paymentApprovedAt).toLocaleString() : "❌ NOT SET"}`);
      console.log(`   Approved By: ${latestPayment.paymentApprovedBy || "N/A"}`);
      console.log(`   Created At: ${new Date(latestPayment.createdAt).toLocaleString()}`);

      // Check visibility condition
      const isSuccess = latestPayment.status === "success";
      const hasRazorpayVerification = latestPayment.paymentId && latestPayment.signature;
      const hasManualVerification = latestPayment.paymentApprovedAt;
      const willBeVisible = isSuccess && (hasRazorpayVerification || hasManualVerification);

      console.log(`\n✓ Visibility Check:`);
      console.log(`   Status="success": ${isSuccess ? "✅ YES" : "❌ NO"}`);
      console.log(`   Razorpay verified: ${hasRazorpayVerification ? "✅ YES" : "❌ NO"}`);
      console.log(`   Manual verified: ${hasManualVerification ? "✅ YES" : "❌ NO"}`);
      console.log(`   WILL APPEAR IN REGISTRATIONS: ${willBeVisible ? "✅✅✅ YES" : "❌❌❌ NO"}`);

      if (!willBeVisible) {
        console.log(`\n🚨 PROBLEM: Should appear but won't because:`);
        if (!isSuccess) console.log(`   - Status is "${latestPayment.status}", not "success"`);
        if (!hasRazorpayVerification) console.log(`   - Missing Razorpay verification (paymentId & signature)`);
        if (!hasManualVerification) console.log(`   - Missing manual verification (paymentApprovedAt not set)`);
      }

      // Show all payments if multiple
      if (payments.length > 1) {
        console.log(`\n📋 All payments for this team (${payments.length} total):`);
        payments.forEach((p, idx) => {
          const status = p.status === "success" ? "✅" : "❌";
          const verified = (p.paymentId && p.signature) || p.paymentApprovedAt ? "✅" : "❌";
          const date = new Date(p.createdAt).toLocaleDateString();
          console.log(`   ${idx + 1}. [${status}] Status: ${p.status.padEnd(15)} | Verified: ${verified} | Created: ${date}`);
        });
      }
    }

    // Summary
    console.log(`\n\n${"━".repeat(80)}`);
    console.log(`📊 FINAL SUMMARY`);
    console.log(`${"━".repeat(80)}\n`);

    const allPayments = await Payment.find({ status: "success" }).select("teamId status paymentApprovedAt paymentId signature");
    console.log(`✅ Total teams with status="success" in database: ${new Set(allPayments.map(p => p.teamId.toString())).size}`);

    const correctlyVerified = allPayments.filter(p => 
      (p.paymentId && p.signature) || p.paymentApprovedAt
    );
    console.log(`✅ Teams that WILL show in Registrations: ${new Set(correctlyVerified.map(p => p.teamId.toString())).size}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

freshDiagnostic();
