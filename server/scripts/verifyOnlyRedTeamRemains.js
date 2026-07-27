import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

async function verifyOnlyRedTeamRemains() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    // Simulate searchRegistrations with paymentStatus=success filter
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

    const allowedTeamIds = verifiedPayments.map(item => item._id);

    console.log(`📊 Teams with VERIFIED payments (status=success + paymentId + signature):`);
    console.log(`   Total: ${allowedTeamIds.length}\n`);

    if (allowedTeamIds.length === 0) {
      console.log("   ❌ NO TEAMS FOUND - Something went wrong!");
      return;
    }

    // Get those teams
    const teams = await Team.find({ _id: { $in: allowedTeamIds } })
      .populate("leader", "name email mobile");

    for (const team of teams) {
      const payment = verifiedPayments.find(p => p._id.toString() === team._id.toString());
      console.log(`   ✅ ${team.name}`);
      console.log(`      Leader: ${team.leaderName} (${team.leader?.email})`);
      console.log(`      Payment: ${payment.status}`);
      console.log(`      Order: ${payment.orderId}`);
      console.log(``);
    }

    console.log(`🎯 RESULT: ${allowedTeamIds.length === 1 ? "✅ ONLY RED TEAM" : "❌ Multiple teams"} will appear in Admin Registrations page!`);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verifyOnlyRedTeamRemains();
