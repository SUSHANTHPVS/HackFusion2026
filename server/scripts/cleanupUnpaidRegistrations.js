/**
 * Cleanup Script: Remove all unpaid team registrations
 * Deletes teams that haven't completed payment verification
 * 
 * IMPORTANT: This script will:
 * 1. Find all teams without valid payment verification
 * 2. Delete their registrations, payments, and related data
 * 3. Delete the Team documents
 * 4. Allow those users to re-register
 * 
 * A valid payment requires ALL of:
 * - status = "success"
 * - paymentId exists and not null
 * - signature exists and not null
 */

import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { Submission } from "../models/Submission.js";
import { Score } from "../models/Score.js";
import { PaymentAudit } from "../models/PaymentAudit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function cleanupUnpaidRegistrations() {
  try {
    console.log("\n========== UNPAID REGISTRATION CLEANUP ==========\n");

    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Connected to MongoDB\n");

    // Step 1: Find all unpaid teams
    const unpaidTeams = await Team.aggregate([
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "teamId",
          as: "payment",
        },
      },
      {
        $unwind: {
          path: "$payment",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            { "payment.status": { $ne: "success" } },
            { "payment.paymentId": null },
            { "payment.paymentId": { $exists: false } },
            { "payment.signature": null },
            { "payment.signature": { $exists: false } },
            { payment: { $exists: false } },
          ],
        },
      },
      { $project: { _id: 1, name: 1, leader: 1 } },
    ]);

    console.log(`Found ${unpaidTeams.length} unpaid teams to delete\n`);

    if (unpaidTeams.length === 0) {
      console.log("✓ No unpaid teams found. Database is clean!\n");
      await mongoose.disconnect();
      return;
    }

    // Step 2: Show teams to be deleted
    console.log("========== TEAMS TO DELETE ==========\n");
    const teamIds = [];
    unpaidTeams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name} (ID: ${team._id})`);
      teamIds.push(team._id);
    });

    // Step 3: Delete related documents
    console.log("\n========== DELETING RELATED DATA ==========\n");

    // Delete submissions for these teams
    const submissionDeleteResult = await Submission.deleteMany({
      teamId: { $in: teamIds },
    });
    console.log(`✓ Deleted ${submissionDeleteResult.deletedCount} submissions`);

    // Delete scores for these teams
    const scoreDeleteResult = await Score.deleteMany({
      teamId: { $in: teamIds },
    });
    console.log(`✓ Deleted ${scoreDeleteResult.deletedCount} scores`);

    // Delete payments for these teams
    const paymentDeleteResult = await Payment.deleteMany({
      teamId: { $in: teamIds },
    });
    console.log(`✓ Deleted ${paymentDeleteResult.deletedCount} payment records`);

    // Delete payment audits for these teams
    const auditDeleteResult = await PaymentAudit.deleteMany({
      teamId: { $in: teamIds },
    });
    console.log(`✓ Deleted ${auditDeleteResult.deletedCount} payment audit records`);

    // Step 4: Delete the teams themselves
    const teamDeleteResult = await Team.deleteMany({
      _id: { $in: teamIds },
    });
    console.log(`✓ Deleted ${teamDeleteResult.deletedCount} team registrations`);

    console.log("\n========== CLEANUP COMPLETE ==========\n");
    console.log("Summary:");
    console.log(`  - Teams Deleted: ${teamDeleteResult.deletedCount}`);
    console.log(`  - Submissions Deleted: ${submissionDeleteResult.deletedCount}`);
    console.log(`  - Scores Deleted: ${scoreDeleteResult.deletedCount}`);
    console.log(`  - Payments Deleted: ${paymentDeleteResult.deletedCount}`);
    console.log(`  - Payment Audits Deleted: ${auditDeleteResult.deletedCount}`);
    console.log("\n✓ Users can now re-register for the hackathon\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error during cleanup:", error.message);
    process.exit(1);
  }
}

await cleanupUnpaidRegistrations();
