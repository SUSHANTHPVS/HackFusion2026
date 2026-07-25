import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    judgeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    innovation: { type: Number, min: 0, max: 10, required: true },
    technical: { type: Number, min: 0, max: 10, required: true },
    ui: { type: Number, min: 0, max: 10, required: true },
    presentation: { type: Number, min: 0, max: 10, required: true },
    theme: { type: Number, min: 0, max: 10, required: true },
    total: { type: Number, required: true, index: true }
  },
  { timestamps: true }
);

scoreSchema.index({ teamId: 1, judgeId: 1 }, { unique: true });

export const Score = mongoose.model("Score", scoreSchema);
