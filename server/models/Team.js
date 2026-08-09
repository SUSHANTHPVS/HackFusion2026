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
        "Space Intelligence & Digital Exploration",
        "Defence, Security & Crisis Intelligence",
        "Healthcare Intelligence & Digital Health",
        "Rural–Urban Transformation & Smart Communities",
        "Cinema, Media & Entertainment Intelligence",
        "AI for Smarter Living",
        "Technology for Social Good",
        "Smart Automation & Digital Robotics"
      ],
      required: true
    },
    status: { type: String, enum: ["registered", "checked-in", "submitted"], default: "registered", index: true }
  },
  { timestamps: true }
);

teamSchema.index({ createdAt: -1 });

export const Team = mongoose.model("Team", teamSchema);
