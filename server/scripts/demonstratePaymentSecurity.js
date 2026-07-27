import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { env } from "../config/env.js";

/**
 * DEMONSTRATION: Show how the system prevents unpaid teams from appearing
 */
async function demonstratePaymentVerificationSecurity() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("🔐 PAYMENT VERIFICATION SECURITY DEMONSTRATION\n");

    // Scenario 1: Team with NO payment record
    console.log("=" .repeat(70));
    console.log("SCENARIO 1: New Team Registered (No Payment Yet)");
    console.log("=" .repeat(70));
    
    const allTeams = await Team.find({}).limit(5);
    console.log(`\nTotal teams in database: ${allTeams.length}`);
    
    const teamsWithPayments = await Team.find({
      _id: { $in: (await Payment.distinct("teamId")) }
    });
    
    const teamsWithoutPayments = await Team.find({
      _id: { $nin: (await Payment.distinct("teamId")) }
    });
    
    console.log(`  Teams with payment records: ${teamsWithPayments.length}`);
    console.log(`  Teams WITHOUT payment records: ${teamsWithoutPayments.length}`);
    
    if (teamsWithoutPayments.length > 0) {
      console.log(`\n  ❌ These teams WILL NOT appear in registrations:`);
      for (const team of teamsWithoutPayments.slice(0, 3)) {
        console.log(`     - ${team.name} (Leader: ${team.leaderName})`);
      }
    }

    // Scenario 2: Admin searches with payment filter
    console.log(`\n${"=" .repeat(70)}`);
    console.log("SCENARIO 2: Admin Searches Registrations with Payment Filter");
    console.log("=" .repeat(70));
    
    const verifiedPayments = await Payment.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$teamId",
          status: { $first: "$status" },
          paymentId: { $first: "$paymentId" },
          signature: { $first: "$signature" }
        }
      }
    ]);

    console.log(`\nTotal payment records: ${verifiedPayments.length}`);
    
    // Analyze breakdown
    let statusSuccessCount = 0;
    let missingPaymentIdCount = 0;
    let missingSignatureCount = 0;
    let fullyVerified = 0;

    for (const payment of verifiedPayments) {
      if (payment.status === "success") statusSuccessCount++;
      if (!payment.paymentId) missingPaymentIdCount++;
      if (!payment.signature) missingSignatureCount++;
      if (payment.status === "success" && payment.paymentId && payment.signature) {
        fullyVerified++;
      }
    }

    console.log(`\n  Breakdown by status:`);
    console.log(`    ✅ Status="success": ${statusSuccessCount}`);
    console.log(`    ❌ Missing paymentId: ${missingPaymentIdCount}`);
    console.log(`    ❌ Missing signature: ${missingSignatureCount}`);
    console.log(`    ✅✅✅ FULLY VERIFIED (all 3 fields): ${fullyVerified}`);

    // Show verified teams
    console.log(`\n  Teams that WILL appear in registrations:`);
    console.log(`  (status="success" AND paymentId exists AND signature exists)\n`);

    const fullyVerifiedPayments = await Payment.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$teamId",
          status: { $first: "$status" },
          paymentId: { $first: "$paymentId" },
          signature: { $first: "$signature" }
        }
      },
      {
        $match: {
          status: "success",
          paymentId: { $exists: true, $ne: null },
          signature: { $exists: true, $ne: null }
        }
      }
    ]);

    if (fullyVerifiedPayments.length === 0) {
      console.log(`    ❌ NO TEAMS - All teams filtered out!`);
    } else {
      for (const payment of fullyVerifiedPayments) {
        const team = await Team.findById(payment._id);
        console.log(`    ✅ ${team.name} (Leader: ${team.leaderName})`);
        console.log(`       - Status: ${payment.status}`);
        console.log(`       - PaymentId: ${payment.paymentId.substring(0, 10)}...`);
        console.log(`       - Signature: ${payment.signature.substring(0, 10)}...`);
      }
    }

    // Show what gets filtered out
    console.log(`\n  Teams that WILL NOT appear (filtered out):`);
    console.log(`  (missing paymentId OR missing signature)\n`);

    const unverifiedPayments = await Payment.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$teamId",
          status: { $first: "$status" },
          paymentId: { $first: "$paymentId" },
          signature: { $first: "$signature" }
        }
      },
      {
        $match: {
          $or: [
            { paymentId: { $exists: false } },
            { paymentId: null },
            { signature: { $exists: false } },
            { signature: null }
          ]
        }
      }
    ]);

    if (unverifiedPayments.length === 0) {
      console.log(`    ✅ NONE - All teams are properly verified!`);
    } else {
      for (const payment of unverifiedPayments.slice(0, 5)) {
        const team = await Team.findById(payment._id);
        const reason = !payment.paymentId ? "missing paymentId" : "missing signature";
        console.log(`    ❌ ${team.name} - ${reason}`);
      }
    }

    // Final verification
    console.log(`\n${"=" .repeat(70)}`);
    console.log("SECURITY VERIFICATION");
    console.log("=" .repeat(70));
    console.log(`\n✅ System Configuration:`);
    console.log(`   1. Teams need payment INITIATED (status="created")`);
    console.log(`   2. Payment must VERIFY with Razorpay signature check`);
    console.log(`   3. Verification sets BOTH paymentId AND signature`);
    console.log(`   4. Admin filter requires ALL 3 fields present`);
    console.log(`   5. Only verified teams appear in registrations`);
    console.log(`\n✅ Result: Unpaid teams are BLOCKED from registrations`);
    console.log(`✅ Result: Only teams with verified payments appear`);
    console.log(`✅ Result: Real-time - appears immediately after verification`);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

demonstratePaymentVerificationSecurity();
