import { User } from "../models/User.js";
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
