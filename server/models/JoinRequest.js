import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true }
  },
  { timestamps: true }
);

joinRequestSchema.index({ team: 1, requester: 1 }, { unique: true });

export const JoinRequest = mongoose.model("JoinRequest", joinRequestSchema);
