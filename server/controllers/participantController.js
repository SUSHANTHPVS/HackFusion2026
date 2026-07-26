import { Submission } from "../models/Submission.js";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function buildMemberRows(team) {
  return [
    {
      role: "Team Leader",
      name: team.leaderName,
      gender: team.leaderGender,
      rollNo: team.rollNo,
      year: team.year,
      branch: team.branch,
      section: team.section
    },
    ...(team.teammates || []).map((mate, index) => ({
      role: `Teammate ${index + 1}`,
      name: mate.name,
      gender: mate.gender,
      rollNo: mate.rollNo,
      year: mate.year,
      branch: mate.branch,
      section: mate.section
    }))
  ];
}

export const myDashboard = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ leader: req.user._id }).lean();
  const submission = team ? await Submission.findOne({ teamId: team._id }).lean() : null;
  const latestPayment = team ? await Payment.findOne({ teamId: team._id }).sort({ createdAt: -1 }).lean() : null;
  const paymentHistory = team ? await Payment.find({ teamId: team._id }).sort({ createdAt: -1 }).lean() : [];

  res.json({
    profile: {
      name: req.user.name,
      email: req.user.email,
      mobile: req.user.mobile,
      profilePicture: req.user.profilePicture,
      gender: req.user.gender,
      department: req.user.department,
      ieeeMember: req.user.ieeeMember,
      checkedIn: req.user.checkedIn,
      qrCode: req.user.qrCode
    },
    team,
    submission,
    payment: latestPayment,
    payments: paymentHistory
  });
});

export const submitProject = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ leader: req.user._id });
  if (!team) {
    return res.status(400).json({ message: "Create and pay for a team before submission." });
  }

  const submission = await Submission.findOneAndUpdate(
    { teamId: team._id },
    {
      teamId: team._id,
      submittedBy: req.user._id,
      projectTitle: req.body.projectTitle,
      repoUrl: req.body.repoUrl,
      demoUrl: req.body.demoUrl,
      pptUrl: req.body.pptUrl,
      notes: req.body.notes
    },
    { upsert: true, new: true }
  );

  team.status = "submitted";
  await team.save();

  res.json({ message: "Submission saved", submission });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email.toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
    _id: { $ne: req.user._id }
  });

  if (existingUser) {
    throw new AppError("Email already exists", 409);
  }

  req.user.name = req.body.name;
  req.user.email = normalizedEmail;
  req.user.mobile = req.body.mobile;
  req.user.profilePicture = req.body.profilePicture;
  req.user.gender = req.body.gender;

  await req.user.save();

  res.json({
    message: "Profile updated",
    profile: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      mobile: req.user.mobile,
      profilePicture: req.user.profilePicture,
      gender: req.user.gender,
      department: req.user.department,
      ieeeMember: req.user.ieeeMember,
      checkedIn: req.user.checkedIn
    }
  });
});

export const listExploreTeams = asyncHandler(async (req, res) => {
  const ownTeam = await Team.findOne({ leader: req.user._id }).select("_id").lean();

  const teams = await Team.find({
    _id: { $ne: ownTeam?._id }
  })
    .sort({ createdAt: -1 })
    .lean();

  const requests = await JoinRequest.find({ requester: req.user._id })
    .select("team status")
    .lean();

  const requestMap = new Map(requests.map((item) => [String(item.team), item.status]));

  const data = teams.map((team) => ({
    id: team._id,
    teamName: team.name,
    participationType: team.participationType,
    themeTrack: team.themeTrack,
    memberRows: buildMemberRows(team)
  }));

  res.json({ teams: data });
});
