import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { env } from "../config/env.js";

const teamsToCheck = [
  "Hackx",
  "Codevision",
  "Tech titans",
  "Team errros",
  "Apexcode",
  "Apex",
  "Code catalysts"
];

async function checkTeamPaymentStatus() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    for (const teamName of teamsToCheck) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 Checking: ${teamName}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Find team
      const team = await Team.findOne({ name: { $regex: teamName, $options: "i" } });
      
      if (!team) {
        console.log(`❌ Team not found in database`);
        continue;
      }

      console.log(`✅ Team found:`);
      console.log(`   ID: ${team._id}`);
      console.log(`   Name: ${team.name}`);
      console.log(`   Leader: ${team.leaderName}`);

      // Find all payments for this team
      const payments = await Payment.find({ teamId: team._id }).sort({ createdAt: -1 });

      if (payments.length === 0) {
        console.log(`\n❌ No payments found for this team`);
        continue;
      }

      console.log(`\n📊 Payment Records (${payments.length} total):`);

      payments.forEach((payment, index) => {
        console.log(`\n   [Payment ${index + 1}]`);
        console.log(`   ├─ Status: ${payment.status}`);
        console.log(`   ├─ Amount: ${payment.amount} ${payment.currency}`);
        console.log(`   ├─ Payment Method: ${payment.paymentMethod || "N/A"}`);
        console.log(`   ├─ Order ID: ${payment.orderId || "N/A"}`);
        console.log(`   ├─ Payment ID (Razorpay): ${payment.paymentId || "N/A"}`);
        console.log(`   ├─ Signature: ${payment.signature ? "✅ Present" : "❌ Missing"}`);
        console.log(`   ├─ Payment Approved At: ${payment.paymentApprovedAt ? new Date(payment.paymentApprovedAt).toLocaleString() : "❌ NOT SET"}`);
        console.log(`   ├─ Payment Approved By: ${payment.paymentApprovedBy || "N/A"}`);
        console.log(`   └─ Created At: ${new Date(payment.createdAt).toLocaleString()}`);

        // Check if this payment should appear in Registrations
        const isRazorpayVerified = payment.paymentId && payment.signature;
        const isManualVerified = payment.paymentApprovedAt;
        const isSuccess = payment.status === "success";

        console.log(`\n   🔍 Verification Check:`);
        console.log(`   ├─ Status is "success": ${isSuccess ? "✅ YES" : "❌ NO"}`);
        console.log(`   ├─ Razorpay Verified (paymentId + signature): ${isRazorpayVerified ? "✅ YES" : "❌ NO"}`);
        console.log(`   ├─ Manual Verified (paymentApprovedAt): ${isManualVerified ? "✅ YES" : "❌ NO"}`);
        console.log(`   └─ Will appear in Registrations: ${isSuccess && (isRazorpayVerified || isManualVerified) ? "✅ YES" : "❌ NO"}`);
      });
    }

    // Summary: Show all payments with status "success" that are NOT showing up
    console.log(`\n\n${'━'.repeat(80)}`);
    console.log(`📊 SUMMARY: Checking all "success" payments that should be in Registrations`);
    console.log(`${'━'.repeat(80)}\n`);

    const successPayments = await Payment.aggregate([
      { $match: { status: "success" } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$teamId",
          status: { $first: "$status" },
          paymentId: { $first: "$paymentId" },
          signature: { $first: "$signature" },
          paymentApprovedAt: { $first: "$paymentApprovedAt" },
          teamId: { $first: "$teamId" }
        }
      }
    ]);

    console.log(`✅ Total teams with status="success": ${successPayments.length}\n`);

    // Get team names for these payments
    const teamIds = successPayments.map(p => p._id);
    const teams = await Team.find({ _id: { $in: teamIds } });
    const teamMap = new Map(teams.map(t => [t._id.toString(), t.name]));

    let shouldAppear = 0;
    let problemPayments = [];

    for (const payment of successPayments) {
      const teamId = payment._id.toString();
      const teamName = teamMap.get(teamId) || "Unknown";
      const isRazorpayVerified = payment.paymentId && payment.signature;
      const isManualVerified = payment.paymentApprovedAt;
      const willAppear = isRazorpayVerified || isManualVerified;

      if (willAppear) {
        shouldAppear++;
      } else {
        problemPayments.push({
          teamName,
          teamId,
          status: payment.status,
          hasPaymentId: !!payment.paymentId,
          hasSignature: !!payment.signature,
          hasPaymentApprovedAt: !!payment.paymentApprovedAt
        });
      }
    }

    console.log(`✅ Should appear in Registrations: ${shouldAppear}`);
    console.log(`❌ PROBLEMS (status=success but missing verification fields): ${problemPayments.length}\n`);

    if (problemPayments.length > 0) {
      console.log(`🚨 PROBLEM PAYMENTS (Missing verification):`);
      problemPayments.forEach(p => {
        console.log(`\n   Team: ${p.teamName}`);
        console.log(`   ├─ Has paymentId: ${p.hasPaymentId ? "✅ YES" : "❌ NO"}`);
        console.log(`   ├─ Has signature: ${p.hasSignature ? "✅ YES" : "❌ NO"}`);
        console.log(`   └─ Has paymentApprovedAt: ${p.hasPaymentApprovedAt ? "✅ YES" : "❌ NO"}`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

checkTeamPaymentStatus();
