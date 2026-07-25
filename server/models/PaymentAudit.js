import mongoose from "mongoose";

const paymentAuditSchema = new mongoose.Schema(
  {
    paymentRef: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", index: true },
    orderId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", index: true },
    eventType: {
      type: String,
      enum: [
        "VERIFY_ATTEMPT",
        "VERIFY_SUCCESS",
        "VERIFY_FAILED",
        "WEBHOOK_RECEIVED",
        "WEBHOOK_CAPTURED",
        "WEBHOOK_FAILED",
        "RECOVERY_ORDER_CREATED"
      ],
      required: true,
      index: true
    },
    source: {
      type: String,
      enum: ["client", "webhook", "admin", "system"],
      required: true,
      index: true
    },
    status: { type: String, enum: ["success", "failed", "info"], required: true, index: true },
    message: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

paymentAuditSchema.index({ orderId: 1, createdAt: -1 });

export const PaymentAudit = mongoose.model("PaymentAudit", paymentAuditSchema);
