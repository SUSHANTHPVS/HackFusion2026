import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const checkInByParticipantId = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body.participantId);
  if (!user) {
    return res.status(404).json({ message: "Participant not found" });
  }

  user.checkedIn = true;
  await user.save();

  res.json({ message: "Attendance marked", participantId: user._id });
});
