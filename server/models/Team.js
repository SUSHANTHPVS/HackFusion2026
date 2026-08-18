import mongoose from "mongoose";

const teammateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    rollNo: { type: String, required: true, trim: true, uppercase: true },
    mobile: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true, uppercase: true }
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    leaderName: { type: String, required: true, trim: true },
    leaderGender: { type: String, enum: ["male", "female"], required: true },
    rollNo: { type: String, required: true, trim: true, uppercase: true, index: true },
    year: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true, index: true },
    section: { type: String, required: true, trim: true, uppercase: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    participationType: { type: String, enum: ["individual", "team"], required: true, default: "individual" },
    teammates: { type: [teammateSchema], default: [] },
    allowJoinRequests: { type: Boolean, default: true },
    themeTrack: {
      type: String,
      enum: [
        "Adaptive Robot Workforce",
        "Self-Healing Autonomous Systems",
        "Robot Swarms Under Communication Loss",
        "Autonomous Construction Intelligence",
        "Autonomous Energy Infrastructure Guardian",
        "Autonomous Underground & Confined-Space Intelligence",
        "Cyber-Physical Robot Security",
        "Robot Intelligence Under Resource Constraints"
      ],
      required: true
    },
    status: { type: String, enum: ["registered", "checked-in", "submitted"], default: "registered", index: true }
  },
  { timestamps: true }
);

teamSchema.index({ createdAt: -1 });

export const Team = mongoose.model("Team", teamSchema);
