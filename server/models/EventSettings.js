import mongoose from "mongoose";

const eventSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "primary" },
    registrationClosed: { type: Boolean, default: false },
    individualFeeInr: { type: Number, required: true, default: 50, min: 0 },
    teamFeeInr: { type: Number, required: true, default: 200, min: 0 }
  },
  { timestamps: true }
);

export const EventSettings = mongoose.model("EventSettings", eventSettingsSchema);
