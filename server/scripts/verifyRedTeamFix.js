import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

async function verifyRedTeamFix() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("\n📊 Verification Status After Fix:\n");

    // Get all teams with verified payments (same logic as searchRegistrations)
    const verifiedPayments = await Payment.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$teamId",
          status: { $first: "$status" },
          paymentId: { $first: "$paymentId" },
          signature: { $first: "$signature" },
          orderId: { $first: "$orderId" }
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

    console.log(`✅ Teams with VERIFIED payments (will appear in registrations):`);
    console.log(`   Total: ${verifiedPayments.length}\n`);

    for (const payment of verifiedPayments) {
      const team = await Team.findById(payment._id).populate("leader", "name email");
      const isRedTeam = team.leaderName === "king" ? "🔴 RED TEAM" : "";
      console.log(`   ${isRedTeam} ${team.name} - Leader: ${team.leaderName} (${team.leader?.email})`);
    }

    // Check Red team specifically
    console.log(`\n🔍 Red Team Status:`);
    const redTeam = await Team.findOne({ leaderName: "king" });
    const redPayment = await Payment.findOne({ teamId: redTeam._id }).sort({ createdAt: -1 });

    const isVerified = redPayment.status === "success" && redPayment.paymentId && redPayment.signature;
    console.log(`   Team: ${redTeam.name}`);
    console.log(`   Leader: ${redTeam.leaderName} (${redTeam.leader?.email})`);
    console.log(`   Status: ${redPayment.status}`);
    console.log(`   PaymentId: ${redPayment.paymentId}`);
    console.log(`   Signature: ${redPayment.signature}`);
    console.log(`   ${isVerified ? "✅ WILL APPEAR IN REGISTRATIONS" : "❌ WILL NOT APPEAR"}`);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verifyRedTeamFix();
