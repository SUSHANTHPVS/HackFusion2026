import { Score } from "../models/Score.js";
import { Team } from "../models/Team.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const assignedTeams = asyncHandler(async (_req, res) => {
  const teams = await Team.find().sort({ createdAt: -1 }).limit(50).lean();
  res.json({ teams });
});

export const submitScore = asyncHandler(async (req, res) => {
  const { teamId, innovation, technical, ui, presentation, theme } = req.body;
  const total = innovation + technical + ui + presentation + theme;

  const score = await Score.findOneAndUpdate(
    { teamId, judgeId: req.user._id },
    { teamId, judgeId: req.user._id, innovation, technical, ui, presentation, theme, total },
    { upsert: true, new: true }
  );

  res.json({ message: "Score submitted", score });
});

export const leaderboard = asyncHandler(async (_req, res) => {
  const standings = await Score.aggregate([
    {
      $group: {
        _id: "$teamId",
        averageScore: { $avg: "$total" },
        judges: { $sum: 1 }
      }
    },
    { $sort: { averageScore: -1 } },
    { $limit: 20 }
  ]);

  res.json({ standings });
});
