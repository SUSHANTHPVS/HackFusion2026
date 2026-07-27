import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

async function checkRedTeamPayment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find Red team by leader name "king" and email "king2005@gmail.com"
    const redTeam = await Team.findOne({
      leaderName: "king"
    }).populate("leader", "name email");

    if (!redTeam) {
      console.log("❌ Red team NOT FOUND in database");
      console.log("\nSearching for team with leader email 'king2005@gmail.com'...");
      const allTeams = await Team.find({}).populate("leader", "name email");
      console.log("\nAll teams in database:");
      for (const team of allTeams) {
        console.log(`  - Team: ${team.name}, Leader: ${team.leaderName}, Leader Email: ${team.leader?.email}`);
      }
      return;
    }

    console.log("✅ Red team FOUND:");
    console.log(`   Team ID: ${redTeam._id}`);
    console.log(`   Team Name: ${redTeam.name}`);
    console.log(`   Leader Name: ${redTeam.leaderName}`);
    console.log(`   Leader Email: ${redTeam.leader?.email}`);

    // Check payment for Red team
    const payment = await Payment.findOne({ teamId: redTeam._id }).sort({ createdAt: -1 });

    if (!payment) {
      console.log("\n❌ NO PAYMENT RECORD for Red team");
      return;
    }

    console.log("\n📋 Payment Record:");
    console.log(`   Payment Status: ${payment.status}`);
    console.log(`   Order ID: ${payment.orderId}`);
    console.log(`   Payment ID: ${payment.paymentId || "❌ MISSING"}`);
    console.log(`   Signature: ${payment.signature ? "✅ Present" : "❌ MISSING"}`);
    console.log(`   Amount: ${payment.amount}`);
    console.log(`   Created At: ${payment.createdAt}`);

    // Determine if it will appear in registrations
    const willAppear = payment.status === "success" && payment.paymentId && payment.signature;
    console.log(`\n🎯 Will appear in registrations (paymentStatus=success)? ${willAppear ? "✅ YES" : "❌ NO"}`);

    if (!willAppear) {
      console.log("\n❌ Reason why Red team is NOT visible:");
      if (payment.status !== "success") {
        console.log(`   - Payment status is "${payment.status}" (not "success")`);
      }
      if (!payment.paymentId) {
        console.log(`   - Missing paymentId (signature verification never completed)`);
      }
      if (!payment.signature) {
        console.log(`   - Missing signature (verification data not saved)`);
      }
    }

    // Compare with visible teams
    console.log("\n📊 Comparison with visible teams:");
    const visibleTeams = await Payment.aggregate([
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

    for (const vTeam of visibleTeams) {
      const team = await Team.findById(vTeam._id).populate("leader", "name email");
      console.log(`   ✅ ${team.name} - Leader: ${team.leaderName} (${team.leader?.email})`);
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkRedTeamPayment();
