import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const checkInByParticipantId = asyncHandler(async (req, res) => {
  const checkedIn = req.body.checkedIn ?? true;
  const result = await User.updateOne(
    { _id: req.body.participantId },
    { $set: { checkedIn } }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: "Participant not found" });
  }

  res.json({
    message: checkedIn ? "Attendance marked" : "Attendance removed",
    participantId: req.body.participantId,
    checkedIn
  });
});

export const bulkCheckIn = asyncHandler(async (req, res) => {
  const checkedIn = req.body.checkedIn ?? true;
  const participantIds = req.body.participantIds || [];

  const result = await User.updateMany(
    { _id: { $in: participantIds } },
    { $set: { checkedIn } }
  );

  res.json({
    message: checkedIn ? "Attendance marked for selected participants" : "Attendance removed for selected participants",
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    checkedIn
  });
});

// memberKeys: "leader" for the team leader, or "teammate-<index>" for a teammate entry.
export const teamBulkCheckIn = asyncHandler(async (req, res) => {
  const checkedIn = req.body.checkedIn ?? true;
  const memberKeys = req.body.memberKeys || [];

  const team = await Team.findById(req.body.teamId);
  if (!team) {
    throw new AppError("Team not found", 404);
  }

  let leaderUpdated = false;
  let teammatesUpdated = 0;

  for (const key of memberKeys) {
    if (key === "leader") {
      leaderUpdated = true;
      continue;
    }

    const match = /^teammate-(\d+)$/.exec(key);
    if (!match) {
      continue;
    }

    const index = Number(match[1]);
    if (team.teammates[index]) {
      team.teammates[index].checkedIn = checkedIn;
      teammatesUpdated += 1;
    }
  }

  if (teammatesUpdated > 0) {
    team.markModified("teammates");
    await team.save();
  }

  if (leaderUpdated) {
    await User.updateOne({ _id: team.leader }, { $set: { checkedIn } });
  }

  res.json({
    message: checkedIn ? "Attendance marked for selected members" : "Attendance removed for selected members",
    teamId: team._id,
    leaderUpdated,
    teammatesUpdated,
    checkedIn
  });
});
