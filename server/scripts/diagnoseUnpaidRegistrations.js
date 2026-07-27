/**
 * Diagnostic Script: Check all unpaid registrations
 * Shows teams and users who haven't completed payment verification
 */

import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function diagnoseUnpaidRegistrations() {
  try {
    console.log("\n========== UNPAID REGISTRATIONS DIAGNOSIS ==========\n");

    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Connected to MongoDB\n");

    // Count all teams
    const totalTeams = await Team.countDocuments();
    console.log(`Total Teams: ${totalTeams}\n`);

    // Find all teams with their payment status
    const teams = await Team.find()
      .select("name leader")
      .populate("leader", "email username")
      .lean();

    let paidTeams = [];
    let unpaidTeams = [];

    for (const team of teams) {
      const payment = await Payment.findOne({ teamId: team._id })
        .select("status paymentId signature orderId")
        .lean();

      if (payment && payment.status === "success" && payment.paymentId && payment.signature) {
        paidTeams.push({
          teamName: team.name,
          teamId: team._id,
          leader: team.leader?.username || "N/A",
          leaderEmail: team.leader?.email || "N/A",
          paymentId: payment.paymentId,
          orderId: payment.orderId,
          status: payment.status,
        });
      } else {
        unpaidTeams.push({
          teamName: team.name,
          teamId: team._id,
          leader: team.leader?.username || "N/A",
          leaderEmail: team.leader?.email || "N/A",
          paymentId: payment?.paymentId || null,
          signature: payment?.signature || null,
          status: payment?.status || "no_payment",
          orderId: payment?.orderId || null,
        });
      }
    }

    console.log("========== PAID TEAMS (Verified) ==========");
    console.log(`Count: ${paidTeams.length}\n`);
    paidTeams.forEach((team) => {
      console.log(`✓ ${team.teamName} (${team.leaderEmail})`);
      console.log(`  - Leader: ${team.leader}`);
      console.log(`  - Payment ID: ${team.paymentId}`);
      console.log(`  - Order ID: ${team.orderId}\n`);
    });

    console.log("\n========== UNPAID TEAMS (To be deleted) ==========");
    console.log(`Count: ${unpaidTeams.length}\n`);
    unpaidTeams.forEach((team) => {
      console.log(`✗ ${team.teamName} (${team.leaderEmail})`);
      console.log(`  - Leader: ${team.leader}`);
      console.log(`  - Status: ${team.status}`);
      console.log(`  - Payment ID: ${team.paymentId || "MISSING"}`);
      console.log(`  - Signature: ${team.signature ? "EXISTS" : "MISSING"}`);
      console.log(`  - Order ID: ${team.orderId || "N/A"}\n`);
    });

    console.log("\n========== SUMMARY ==========");
    console.log(`Total Teams: ${totalTeams}`);
    console.log(`✓ Paid (Will Keep): ${paidTeams.length}`);
    console.log(`✗ Unpaid (Will Delete): ${unpaidTeams.length}`);
    console.log(`Percentage Paid: ${((paidTeams.length / totalTeams) * 100).toFixed(2)}%\n`);

    // Check for duplicate registrations by same user
    console.log("\n========== CHECKING FOR DUPLICATE USER REGISTRATIONS ==========\n");
    const userTeamCounts = await Team.aggregate([
      {
        $group: {
          _id: "$leader",
          teamCount: { $sum: 1 },
          teams: { $push: { teamId: "$_id", teamName: "$name" } },
        },
      },
      { $match: { teamCount: { $gt: 1 } } },
      { $sort: { teamCount: -1 } },
    ]);

    if (userTeamCounts.length === 0) {
      console.log("✓ No duplicate user registrations found\n");
    } else {
      console.log(`Found ${userTeamCounts.length} users with multiple team registrations:\n`);
      for (const record of userTeamCounts) {
        const user = await User.findById(record._id).select("username email").lean();
        console.log(`User: ${user?.username || "N/A"} (${user?.email || "N/A"})`);
        console.log(`Teams Created: ${record.teamCount}`);
        record.teams.forEach((t) => {
          console.log(`  - ${t.teamName}`);
        });
        console.log();
      }
    }

    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB\n");
  } catch (error) {
    console.error("Error during diagnosis:", error.message);
    process.exit(1);
  }
}

await diagnoseUnpaidRegistrations();
