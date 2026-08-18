import { Router } from "express";
import { z } from "zod";
import { createTeamAndOrder, getRegistrationStatus } from "../controllers/registrationController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const BRANCH_SECTION_LIMITS = {
  CSE: 20,
  "CSE-DS": 5,
  "CSE-CS": 5,
  AIML: 15,
  IT: 3,
  ECE: 8,
  EEE: 8
};

function isValidSectionForBranch(branch, section) {
  const max = BRANCH_SECTION_LIMITS[branch];
  if (!max) {
    return false;
  }

  const sectionNo = Number(section);
  return Number.isInteger(sectionNo) && sectionNo >= 1 && sectionNo <= max;
}

const schema = z
  .object({
    participationType: z.literal("team"),
    teamName: z.string().min(2),
    teamLeaderName: z.string().min(2),
    leaderGender: z.enum(["male", "female"]),
    rollNo: z.string().min(2),
    year: z.enum(["3rd year", "4th year"]),
    branch: z.enum(["CSE", "CSE-DS", "CSE-CS", "AIML", "IT", "ECE", "EEE"]),
    section: z.string().regex(/^\d+$/, "Section must be a number."),
    themeTrack: z.enum([
      "Adaptive Robot Workforce",
      "Self-Healing Autonomous Systems",
      "Robot Swarms Under Communication Loss",
      "Autonomous Construction Intelligence",
      "Autonomous Energy Infrastructure Guardian",
      "Autonomous Underground & Confined-Space Intelligence",
      "Cyber-Physical Robot Security",
      "Robot Intelligence Under Resource Constraints"
    ]),
    teammates: z
      .array(
        z.object({
          name: z.string().min(2),
          gender: z.enum(["male", "female"]),
          rollNo: z.string().min(2),
          mobile: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits."),
          year: z.enum(["3rd year", "4th year"]),
          branch: z.enum(["CSE", "CSE-DS", "CSE-CS", "AIML", "IT", "ECE", "EEE"]),
          section: z.string().regex(/^\d+$/, "Section must be a number.")
        })
      )
      .min(2)
        .max(3)
  })
  .superRefine((data, ctx) => {
    const teammateCount = data.teammates?.length || 0;

    if (teammateCount < 2 || teammateCount > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Team registration must have 2 to 3 teammates (3 to 4 members including leader).",
        path: ["teammates"]
      });
    }

    if (data.teammates?.[1] && !["ECE", "EEE"].includes(data.teammates[1].branch)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The third participant must be from ECE or EEE.",
        path: ["teammates", 1, "branch"]
      });
    }

    const teamBranches = [data.branch, ...(data.teammates || []).map((member) => member.branch)];
    if (!teamBranches.some((branch) => branch === "ECE" || branch === "EEE")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each team must include at least one participant from ECE or EEE.",
        path: ["teammates"]
      });
    }

    if (!isValidSectionForBranch(data.branch, data.section)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Section must be between 1 and ${BRANCH_SECTION_LIMITS[data.branch]} for ${data.branch}.`,
        path: ["section"]
      });
    }

    const leaderRollNo = data.rollNo.trim().toUpperCase();
    const leaderName = data.teamLeaderName.trim().toLowerCase();
    const teammateRollNos = new Set();
    const teammateNames = new Set();

    (data.teammates || []).forEach((member, index) => {
      if (!isValidSectionForBranch(member.branch, member.section)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Section must be between 1 and ${BRANCH_SECTION_LIMITS[member.branch]} for ${member.branch}.`,
          path: ["teammates", index, "section"]
        });
      }

      const rollNo = member.rollNo.trim().toUpperCase();
      const name = member.name.trim().toLowerCase();

      if (rollNo === leaderRollNo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Team leader roll number cannot be duplicated in teammates.",
          path: ["teammates", index, "rollNo"]
        });
      }

      if (name === leaderName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Team leader name cannot be duplicated in teammates.",
          path: ["teammates", index, "name"]
        });
      }

      if (teammateRollNos.has(rollNo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate teammate roll numbers are not allowed.",
          path: ["teammates", index, "rollNo"]
        });
      }

      if (teammateNames.has(name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate teammate names are not allowed.",
          path: ["teammates", index, "name"]
        });
      }

      teammateRollNos.add(rollNo);
      teammateNames.add(name);
    });
  });

router.get("/status", getRegistrationStatus);
router.post("/team", protect, authorize("participant"), validate(schema), createTeamAndOrder);

export default router;
