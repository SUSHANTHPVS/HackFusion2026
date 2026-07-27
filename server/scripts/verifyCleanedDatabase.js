/**
 * Verification Script: Check cleaned database
 * Confirms that only paid teams remain
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

async function verifyCleanedDatabase() {
  try {
    console.log("\n========== DATABASE VERIFICATION AFTER CLEANUP ==========\n");

    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Connected to MongoDB\n");

    // Count remaining teams
    const totalTeams = await Team.countDocuments();
    console.log(`Remaining Teams: ${totalTeams}\n`);

    if (totalTeams === 0) {
      console.log("✓ No teams in database. All unpaid registrations removed.\n");
      await mongoose.disconnect();
      return;
    }

    // Verify all remaining teams have valid payment
    const teamsWithPayment = await Team.aggregate([
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "teamId",
          as: "payment",
        },
      },
      {
        $unwind: "$payment",
      },
      {
        $match: {
          "payment.status": "success",
          "payment.paymentId": { $exists: true, $ne: null },
          "payment.signature": { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          name: 1,
          leader: 1,
          "payment.paymentId": 1,
          "payment.orderId": 1,
          "payment.status": 1,
        },
      },
    ]);

    console.log("========== REMAINING PAID TEAMS ==========\n");
    console.log(`Count: ${teamsWithPayment.length}\n`);

    for (const team of teamsWithPayment) {
      const leader = await User.findById(team.leader).select("username email").lean();
      console.log(`✓ ${team.name}`);
      console.log(`  - Leader: ${leader?.username || "N/A"} (${leader?.email || "N/A"})`);
      console.log(`  - Payment ID: ${team.payment.paymentId}`);
      console.log(`  - Order ID: ${team.payment.orderId}`);
      console.log(`  - Status: ${team.payment.status}\n`);
    }

    // Check for teams without payment (should be none)
    const teamsWithoutPayment = await Team.aggregate([
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "teamId",
          as: "payment",
        },
      },
      {
        $match: {
          payment: { $size: 0 },
        },
      },
    ]);

    console.log("========== TEAMS WITHOUT PAYMENT RECORD ==========");
    if (teamsWithoutPayment.length === 0) {
      console.log("✓ No teams without payment records\n");
    } else {
      console.log(`✗ Found ${teamsWithoutPayment.length} teams without payment:\n`);
      teamsWithoutPayment.forEach((team) => {
        console.log(`  - ${team.name} (${team._id})\n`);
      });
    }

    console.log("========== SUMMARY ==========");
    console.log(`Total Teams: ${totalTeams}`);
    console.log(`Paid Teams (Verified): ${teamsWithPayment.length}`);
    console.log(`Teams Without Payment: ${teamsWithoutPayment.length}`);
    console.log(`\n✓ Database Cleanup Verification Complete\n`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error during verification:", error.message);
    process.exit(1);
  }
}

await verifyCleanedDatabase();
