import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";

const LEGACY_TO_NEW_TRACK_MAP = {
  Robotics: "Smart Automation & Robotics Solutions",
  AI: "AI for Smarter Living",
  Circuits: "Smart & Sustainable Future"
};

function parseArgs(argv) {
  return {
    commit: argv.includes("--commit")
  };
}

async function countByTrack(collection, tracks) {
  return collection
    .aggregate([
      { $match: { themeTrack: { $in: tracks } } },
      { $group: { _id: "$themeTrack", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    .toArray();
}

async function run() {
  const { commit } = parseArgs(process.argv.slice(2));
  const teamCollection = mongoose.connection.collection("teams");
  const legacyTracks = Object.keys(LEGACY_TO_NEW_TRACK_MAP);

  await connectDB(env.MONGODB_URI);

  const legacyCounts = await countByTrack(teamCollection, legacyTracks);
  const totalLegacy = legacyCounts.reduce((sum, item) => sum + item.count, 0);

  if (totalLegacy === 0) {
    console.log("No legacy theme tracks found. Nothing to migrate.");
    return;
  }

  console.log("Legacy theme track records found:");
  legacyCounts.forEach((item) => {
    console.log(`- ${item._id}: ${item.count}`);
  });

  if (!commit) {
    console.log("\nDry run only. No documents were updated.");
    console.log("Run with --commit to apply migration.");
    return;
  }

  let updated = 0;
  for (const [legacyTrack, newTrack] of Object.entries(LEGACY_TO_NEW_TRACK_MAP)) {
    const result = await teamCollection.updateMany({ themeTrack: legacyTrack }, { $set: { themeTrack: newTrack } });
    updated += result.modifiedCount;
    if (result.modifiedCount > 0) {
      console.log(`Updated ${result.modifiedCount} team(s): ${legacyTrack} -> ${newTrack}`);
    }
  }

  console.log(`\nMigration complete. Total updated teams: ${updated}`);

  const newTrackCounts = await countByTrack(teamCollection, Object.values(LEGACY_TO_NEW_TRACK_MAP));
  console.log("\nUpdated track totals:");
  newTrackCounts.forEach((item) => {
    console.log(`- ${item._id}: ${item.count}`);
  });
}

run()
  .catch((error) => {
    console.error("Theme track migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });