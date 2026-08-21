import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    mobile: { type: String, trim: true },
    profilePicture: { type: String },
    password: { type: String, minlength: 8, select: false },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, index: true, sparse: true },
    role: { type: String, enum: ["participant", "admin", "judge"], default: "participant", index: true },
    department: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female"], default: "male" },
    ieeeMember: { type: Boolean, default: false },
    ieeeMemberId: { type: String, trim: true },
    checkedIn: { type: Boolean, default: false },
    qrCode: { type: String }
  },
  { timestamps: true }
);

userSchema.pre("save", async function onSave(next) {
  if (this.isNew && !this.password && this.authProvider === "local") {
    return next(new Error("Password is required for local authentication users."));
  }

  if (!this.password) {
    return next();
  }

  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model("User", userSchema);
