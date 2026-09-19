import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String },
    signature: { type: String },
    amount: { type: Number, required: true },
    participationType: { type: String, enum: ["individual", "team"], required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["created", "success", "failed", "pending_verification"], default: "created", index: true },
    // Bank details for refund processing
    bankDetails: {
      accountHolder: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true, uppercase: true },
      bankName: { type: String, trim: true },
      accountType: { type: String, enum: ["savings", "current"], default: "savings" }
    },
    // Payment method type
    paymentMethod: { type: String, enum: ["online", "bank_transfer", "cheque", "manual_bank_transfer"], default: "online" },
    // Manual payment fields
    paymentProofFile: { type: String },  // File path/URL for payment proof
    paymentProofSubmittedAt: { type: Date },
    paymentApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },  // Admin who approved
    paymentApprovedAt: { type: Date },
    rejectionReason: { type: String },
    // Bank transfer tracking fields
    utrNumber: { type: String, trim: true },  // Unique Transaction Reference number
    transactionId: { type: String, trim: true }  // Bank transaction ID
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);
