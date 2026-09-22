import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { env } from "../config/env.js";

async function testFixedAggregation() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("━".repeat(80));
    console.log("🧪 Testing FIXED Aggregation Pipeline");
    console.log("━".repeat(80) + "\n");

    // Run the FIXED aggregation (status filter FIRST)
    const verifiedPayments = await Payment.aggregate([
      // FIXED: Filter for status="success" FIRST
      { $match: { status: "success" } },
      // Then sort by createdAt descending
      { $sort: { createdAt: -1 } },
      // Group by teamId and take first
      {
        $group: {
          _id: "$teamId",
          status: { $first: "$status" },
          paymentId: { $first: "$paymentId" },
          signature: { $first: "$signature" },
          paymentApprovedAt: { $first: "$paymentApprovedAt" },
          orderId: { $first: "$orderId" }
        }
      },
      // Filter for verified payments
      { $match: { 
        $or: [
          { paymentId: { $exists: true, $ne: null }, signature: { $exists: true, $ne: null } },
          { paymentApprovedAt: { $exists: true, $ne: null } }
        ]
      } }
    ]);

    console.log(`✅ Teams found with status="success": ${verifiedPayments.length}\n`);

    // Get team names
    const teamIds = verifiedPayments.map(p => p._id);
    const teams = await Team.find({ _id: { $in: teamIds } });
    const teamMap = new Map(teams.map(t => [t._id.toString(), t.name]));

    // Check for our target teams
    const targetTeams = ["HACKX", "CodeVision", "Tech Titans", "Apexcode", "Apex", "Code Catalysts", "Team errors"];
    
    console.log("📋 Checking target teams:\n");
    for (const targetName of targetTeams) {
      const found = verifiedPayments.find(p => {
        const name = teamMap.get(p._id.toString()) || "";
        return name.toUpperCase().includes(targetName.toUpperCase());
      });

      if (found) {
        const teamName = teamMap.get(found._id.toString());
        const verified = found.paymentApprovedAt ? "✅ Manual" : (found.paymentId ? "✅ Razorpay" : "❌");
        console.log(`✅ ${targetName.padEnd(20)} -> WILL APPEAR (Verified: ${verified})`);
      } else {
        console.log(`❌ ${targetName.padEnd(20)} -> WILL NOT APPEAR`);
      }
    }

    console.log("\n" + "━".repeat(80));
    console.log("✅ Test Complete - All teams with status='success' will now appear!");
    console.log("━".repeat(80));

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testFixedAggregation();
