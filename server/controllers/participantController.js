import { Submission } from "../models/Submission.js";
import { Team } from "../models/Team.js";
import { Payment } from "../models/Payment.js";
import { JoinRequest } from "../models/JoinRequest.js";
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
    allowJoinRequests: team.allowJoinRequests,
    participationType: team.participationType,
    themeTrack: team.themeTrack,
    memberRows: buildMemberRows(team),
    requestStatus: requestMap.get(String(team._id)) || null
  }));

  res.json({ teams: data });
});

export const requestToJoinTeam = asyncHandler(async (req, res) => {
  const ownTeam = await Team.findOne({ leader: req.user._id }).select("_id").lean();
  if (ownTeam) {
    throw new AppError("You already lead a team. Join request is not allowed.", 400);
  }

  const team = await Team.findById(req.params.teamId);
  if (!team) {
    throw new AppError("Team not found.", 404);
  }

  if (!team.allowJoinRequests) {
    throw new AppError("This team is not accepting join requests right now.", 400);
  }

  const existing = await JoinRequest.findOne({ team: team._id, requester: req.user._id });
  if (existing) {
    return res.status(200).json({
      message: "Join request already submitted.",
      status: existing.status
    });
  }

  const request = await JoinRequest.create({
    team: team._id,
    requester: req.user._id,
    status: "pending"
  });

  res.status(201).json({
    message: "Join request sent to team leader.",
    requestId: request._id,
    status: request.status
  });
});

export const updateJoinRequestPreference = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ leader: req.user._id });
  if (!team) {
    throw new AppError("Create your team first to update this setting.", 404);
  }

  team.allowJoinRequests = req.body.allowJoinRequests;
  await team.save();

  res.json({
    message: "Team join request setting updated.",
    allowJoinRequests: team.allowJoinRequests
  });
});

export const listIncomingJoinRequests = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ leader: req.user._id }).select("_id name allowJoinRequests").lean();
  if (!team) {
    throw new AppError("Create your team first to manage incoming join requests.", 404);
  }

  const requests = await JoinRequest.find({ team: team._id })
    .populate("requester", "name email mobile gender department")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    team: {
      id: team._id,
      name: team.name,
      allowJoinRequests: team.allowJoinRequests
    },
    requests: requests.map((item) => ({
      id: item._id,
      status: item.status,
      createdAt: item.createdAt,
      requester: {
        id: item.requester?._id,
        name: item.requester?.name || "Unknown",
        email: item.requester?.email || "",
        mobile: item.requester?.mobile || "",
        gender: item.requester?.gender || "",
        department: item.requester?.department || ""
      }
    }))
  });
});

export const decideJoinRequest = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ leader: req.user._id }).select("_id allowJoinRequests members participationType teammates");
  if (!team) {
    throw new AppError("Create your team first to review join requests.", 404);
  }

  const request = await JoinRequest.findOne({
    _id: req.params.requestId,
    team: team._id
  });

  if (!request) {
    throw new AppError("Join request not found.", 404);
  }

  if (request.status !== "pending") {
    return res.status(200).json({
      message: "This join request was already reviewed.",
      status: request.status
    });
  }

  const decision = req.body.decision;

  if (decision === "rejected") {
    request.status = "rejected";
    await request.save();

    return res.json({
      message: "Join request rejected.",
      status: request.status
    });
  }

  if (!team.allowJoinRequests) {
    throw new AppError("Enable join requests before approving members.", 400);
  }

  const maxTeamMembers = 4;
  const currentMembersCount = 1 + (team.teammates?.length || 0);
  if (currentMembersCount >= maxTeamMembers) {
    throw new AppError("Team is already full (maximum 4 members).", 400);
  }

  const requester = await User.findById(request.requester);
  if (!requester) {
    throw new AppError("Requesting participant no longer exists.", 404);
  }

  const requesterOwnTeam = await Team.findOne({ leader: requester._id }).select("_id").lean();
  if (requesterOwnTeam) {
    throw new AppError("Requester already leads a team.", 400);
  }

  if (team.members.some((memberId) => String(memberId) === String(requester._id))) {
    request.status = "approved";
    await request.save();

    return res.json({
      message: "Participant is already part of this team.",
      status: request.status
    });
  }

  team.members.push(requester._id);
  team.participationType = "team";
  team.teammates.push({
    name: requester.name,
    gender: requester.gender || "male",
    rollNo: "PENDING",
    year: "3rd year",
    branch: requester.department || "CSE",
    section: "A"
  });
  await team.save();

  request.status = "approved";
  await request.save();

  await JoinRequest.updateMany(
    {
      requester: requester._id,
      team: { $ne: team._id },
      status: "pending"
    },
    { $set: { status: "rejected" } }
  );

  res.json({
    message: "Join request approved and participant added to your team.",
    status: request.status
  });
});
