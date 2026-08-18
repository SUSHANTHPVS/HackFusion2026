import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { JoinRequest } from "../models/JoinRequest.js";
import { Payment } from "../models/Payment.js";
import { PaymentAudit } from "../models/PaymentAudit.js";
import { Score } from "../models/Score.js";
import { Submission } from "../models/Submission.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";

const confirmed = process.argv.includes("--confirm");

if (!confirmed) {
  console.error("Refusing to reset registrations without --confirm.");
  process.exitCode = 1;
} else {
  try {
    await connectDB(env.MONGODB_URI);

    const teams = await Team.find({}, { _id: 1 }).lean();
    const teamIds = teams.map((team) => team._id);
    const participants = await User.find({ role: "participant" }, { _id: 1 }).lean();
    const participantIds = participants.map((participant) => participant._id);

    const [joinRequests, submissions, scores, paymentAudits, payments, teamRecords, participantAccounts] = await Promise.all([
      JoinRequest.deleteMany({ $or: [{ team: { $in: teamIds } }, { requester: { $in: participantIds } }] }),
      Submission.deleteMany({ $or: [{ teamId: { $in: teamIds } }, { submittedBy: { $in: participantIds } }] }),
      Score.deleteMany({ teamId: { $in: teamIds } }),
      PaymentAudit.deleteMany({ $or: [{ teamId: { $in: teamIds } }, { userId: { $in: participantIds } }] }),
      Payment.deleteMany({ $or: [{ teamId: { $in: teamIds } }, { userId: { $in: participantIds } }] }),
      Team.deleteMany({}),
      User.deleteMany({ role: "participant" })
    ]);

    const [remainingTeams, remainingParticipants, successfulRegistrations] = await Promise.all([
      Team.countDocuments(),
      User.countDocuments({ role: "participant" }),
      Payment.countDocuments({ status: "success" })
    ]);

    console.log("Registration reset complete.");
    console.log(`Deleted teams: ${teamRecords.deletedCount}`);
    console.log(`Deleted participant accounts: ${participantAccounts.deletedCount}`);
    console.log(`Deleted payments: ${payments.deletedCount}`);
    console.log(`Deleted payment audits: ${paymentAudits.deletedCount}`);
    console.log(`Deleted join requests: ${joinRequests.deletedCount}`);
    console.log(`Deleted submissions: ${submissions.deletedCount}`);
    console.log(`Deleted scores: ${scores.deletedCount}`);
    console.log(`Remaining teams: ${remainingTeams}`);
    console.log(`Remaining participant accounts: ${remainingParticipants}`);
    console.log(`Successful registrations: ${successfulRegistrations}/${env.REGISTRATION_CAPACITY}`);
  } finally {
    await mongoose.disconnect();
  }
}