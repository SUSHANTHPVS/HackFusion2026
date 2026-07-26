import mongoose from "mongoose";

const eventSettingsAuditSchema = new mongoose.Schema(
  {
    action: { type: String, enum: ["update", "reset"], required: true, index: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    changedByEmail: { type: String, trim: true },
    before: {
      registrationClosed: { type: Boolean },
      individualFeeInr: { type: Number },
      teamFeeInr: { type: Number }
    },
    after: {
      registrationClosed: { type: Boolean },
      individualFeeInr: { type: Number },
      teamFeeInr: { type: Number }
    }
  },
  { timestamps: true }
);

eventSettingsAuditSchema.index({ createdAt: -1 });

export const EventSettingsAudit = mongoose.model("EventSettingsAudit", eventSettingsAuditSchema);
