import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    projectTitle: { type: String, required: true },
    repoUrl: { type: String, required: true },
    demoUrl: { type: String },
    pptUrl: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

submissionSchema.index({ createdAt: -1 });

export const Submission = mongoose.model("Submission", submissionSchema);
