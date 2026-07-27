import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { env } from "../config/env.js";

async function removeUnpaidTeamPayments() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    // Find Red team (the only one with real payment)
    const redTeam = await Team.findOne({ leaderName: "king" });
    if (!redTeam) {
      console.log("❌ Red team not found");
      return;
    }

    console.log(`✅ Red Team Found: ${redTeam.name} (ID: ${redTeam._id})`);

    // Get all payments
    const allPayments = await Payment.find({}).sort({ createdAt: -1 });
    console.log(`\n📊 Total payments in database: ${allPayments.length}`);

    // Separate Red team payment from others
    const redTeamPayments = allPayments.filter(p => p.teamId.toString() === redTeam._id.toString());
    const otherTeamPayments = allPayments.filter(p => p.teamId.toString() !== redTeam._id.toString());

    console.log(`\n📋 Breakdown:`);
    console.log(`   Red team payments: ${redTeamPayments.length}`);
    console.log(`   Other teams payments: ${otherTeamPayments.length}`);

    // Show teams to be removed
    console.log(`\n🗑️  Teams to REMOVE from registrations:`);
    for (const payment of otherTeamPayments) {
      const team = await Team.findById(payment.teamId);
      console.log(`   - ${team.name} (Leader: ${team.leaderName}) - Status: ${payment.status}`);
    }

    // Delete all payments except Red team
    console.log(`\n🔄 Deleting payment records for non-Red teams...`);
    const deleteResult = await Payment.deleteMany({
      teamId: { $ne: redTeam._id }
    });

    console.log(`✅ Deleted ${deleteResult.deletedCount} payment records\n`);

    // Verify only Red team remains
    const remainingPayments = await Payment.find({});
    console.log(`✅ Remaining payments in database: ${remainingPayments.length}`);

    if (remainingPayments.length > 0) {
      for (const payment of remainingPayments) {
        const team = await Team.findById(payment.teamId);
        console.log(`   ✅ ${team.name} - Status: ${payment.status}, PaymentId: ${payment.paymentId}, Signature: ${payment.signature}`);
      }
    }

    console.log(`\n🎯 RESULT: Only Red team will appear in registrations page now!`);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

removeUnpaidTeamPayments();
