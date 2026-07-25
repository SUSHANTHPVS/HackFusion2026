import { Payment } from "../models/Payment.js";
import { Team } from "../models/Team.js";
import { createOrder } from "../services/razorpayService.js";
import { env } from "../config/env.js";
import { buildRegistrationSyncPayload, syncRegistrationToGoogle } from "../services/registrationSyncService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function normalizeName(value = "") {
  return value.trim().toLowerCase();
}

function normalizeRoll(value = "") {
  return value.trim().toUpperCase();
}

function hasTeamCompositionChanged(existingTeam, participantDetails, participationType, normalizedTeammates) {
  if (existingTeam.participationType !== participationType) {
    return true;
  }

  if (normalizeRoll(existingTeam.rollNo) !== participantDetails.rollNo) {
    return true;
  }

  if (normalizeName(existingTeam.leaderName) !== normalizeName(participantDetails.teamLeaderName)) {
    return true;
  }

  const currentTeammates = (existingTeam.teammates || [])
    .map((item) => `${normalizeName(item.name)}|${item.gender}|${normalizeRoll(item.rollNo)}`)
    .sort();
  const incomingTeammates = normalizedTeammates
    .map((item) => `${normalizeName(item.name)}|${item.gender}|${normalizeRoll(item.rollNo)}`)
    .sort();

  if (currentTeammates.length !== incomingTeammates.length) {
    return true;
  }

  return currentTeammates.some((member, index) => member !== incomingTeammates[index]);
}

function validateNoDuplicateMembers(participantDetails, normalizedTeammates) {
  const leaderRollNo = participantDetails.rollNo;
  const leaderName = normalizeName(participantDetails.teamLeaderName);
  const teammateRollNos = new Set();
  const teammateNames = new Set();

  for (const teammate of normalizedTeammates) {
    const rollNo = normalizeRoll(teammate.rollNo);
    const name = normalizeName(teammate.name);

    if (rollNo === leaderRollNo) {
      throw new AppError("Team leader roll number cannot be duplicated in teammates.", 400);
    }

    if (name === leaderName) {
      throw new AppError("Team leader name cannot be duplicated in teammates.", 400);
    }

    if (teammateRollNos.has(rollNo)) {
      throw new AppError("Duplicate teammate roll numbers are not allowed.", 400);
    }

    if (teammateNames.has(name)) {
      throw new AppError("Duplicate teammate names are not allowed.", 400);
    }

    teammateRollNos.add(rollNo);
    teammateNames.add(name);
  }
}

export const createTeamAndOrder = asyncHandler(async (req, res) => {
  const participationType = req.body.participationType;
  const normalizedTeammates = (req.body.teammates || []).map((item) => ({
    name: item.name.trim(),
    gender: item.gender,
    rollNo: item.rollNo.trim().toUpperCase(),
    year: item.year.trim(),
    branch: item.branch.trim(),
    section: item.section.trim().toUpperCase()
  }));
  const participantDetails = {
    teamName: req.body.teamName.trim(),
    teamLeaderName: req.body.teamLeaderName.trim(),
    leaderGender: req.body.leaderGender,
    rollNo: req.body.rollNo.trim().toUpperCase(),
    year: req.body.year.trim(),
    branch: req.body.branch.trim(),
    section: req.body.section.trim().toUpperCase()
  };
  const paymentAmount = participationType === "individual" ? env.INDIVIDUAL_FEE_INR : env.TEAM_FEE_INR;
  const paymentAmountPaise = paymentAmount * 100;
  const triggerRegistrationSync = (team, paymentStatus) => {
    if (!team) {
      return;
    }

    const payload = buildRegistrationSyncPayload({
      team,
      user: req.user,
      paymentStatus,
      feeInr: paymentAmount
    });

    void syncRegistrationToGoogle(payload);
  };

  if (participationType === "individual" && normalizedTeammates.length > 0) {
    throw new AppError("Individual participation cannot include teammates.", 400);
  }

  if (participationType === "team" && (normalizedTeammates.length < 1 || normalizedTeammates.length > 3)) {
    throw new AppError("Team participation must have 1 to 3 teammates (2 to 4 members including leader).", 400);
  }

  validateNoDuplicateMembers(participantDetails, normalizedTeammates);

  const existingTeam = await Team.findOne({ leader: req.user._id });
  if (existingTeam && env.REGISTRATION_CLOSED) {
    const changed = hasTeamCompositionChanged(
      existingTeam,
      participantDetails,
      participationType,
      normalizedTeammates
    );

    if (changed) {
      throw new AppError(
        "Registrations are closed. Team composition cannot be changed without organizer approval.",
        403
      );
    }
  }

  if (existingTeam) {
    const existingPayment = await Payment.findOne({
      userId: req.user._id,
      teamId: existingTeam._id
    }).sort({ createdAt: -1 });

    if (existingPayment?.status === "success") {
      triggerRegistrationSync(existingTeam, "success");
      return res.status(409).json({
        message: "Registration already completed for this participant.",
        team: existingTeam,
        paymentStatus: "success"
      });
    }

    existingTeam.name = participantDetails.teamName;
    existingTeam.leaderName = participantDetails.teamLeaderName;
    existingTeam.leaderGender = participantDetails.leaderGender;
    existingTeam.rollNo = participantDetails.rollNo;
    existingTeam.year = participantDetails.year;
    existingTeam.branch = participantDetails.branch;
    existingTeam.section = participantDetails.section;
    existingTeam.themeTrack = req.body.themeTrack;
    existingTeam.participationType = participationType;
    existingTeam.teammates = normalizedTeammates;
    await existingTeam.save();

    if (existingPayment?.status === "created") {
      // Payment order may be reused for Razorpay. Leave it as is or invalidate if needed.
      // For now, we'll create a new payment record to ensure uniqueness.
    }
  }

  const receipt = `IEEE_${Date.now()}_${req.user._id}`;

  let razorpayOrder;
  try {
    razorpayOrder = await createOrder({
      amount: paymentAmountPaise,
      receipt,
      notes: {
        userId: String(req.user._id),
        participationType,
        teamName: participantDetails.teamName
      }
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error.message);
    throw new AppError(
      "Unable to create payment order. Please verify Razorpay credentials or contact organizer.",
      502
    );
  }

  const session = await Team.startSession();

  let responsePayload;
  let responseStatus = 201;

  try {
    await session.withTransaction(async () => {
      let team = await Team.findOne({ leader: req.user._id }).session(session);

      if (!team) {
        [team] = await Team.create(
          [
            {
              name: participantDetails.teamName,
              leader: req.user._id,
              leaderName: participantDetails.teamLeaderName,
              leaderGender: participantDetails.leaderGender,
              rollNo: participantDetails.rollNo,
              year: participantDetails.year,
              branch: participantDetails.branch,
              section: participantDetails.section,
              members: [req.user._id],
              participationType,
              teammates: normalizedTeammates,
              themeTrack: req.body.themeTrack
            }
          ],
          { session }
        );
      } else {
        team.name = participantDetails.teamName;
        team.leaderName = participantDetails.teamLeaderName;
        team.leaderGender = participantDetails.leaderGender;
        team.rollNo = participantDetails.rollNo;
        team.year = participantDetails.year;
        team.branch = participantDetails.branch;
        team.section = participantDetails.section;
        team.themeTrack = req.body.themeTrack;
        team.participationType = participationType;
        team.teammates = normalizedTeammates;
        await team.save({ session });
      }

      const pendingPayment = await Payment.findOne({
        userId: req.user._id,
        teamId: team._id,
        status: "created"
      }).session(session);

      if (pendingPayment) {
        pendingPayment.status = "failed";
        await pendingPayment.save({ session });
      }

      const successfulPayment = await Payment.findOne({
        userId: req.user._id,
        teamId: team._id,
        status: "success"
      }).session(session);

      if (successfulPayment) {
        responseStatus = 409;
        responsePayload = {
          message: "Registration already completed for this participant.",
          team,
          paymentStatus: "success"
        };
        return;
      }

      await Payment.create(
        [
          {
            userId: req.user._id,
            teamId: team._id,
            orderId: razorpayOrder.id,
            amount: paymentAmount,
            participationType,
            status: "created"
          }
        ],
        { session }
      );

      responsePayload = {
        message: "Team created. Proceed to payment.",
        team,
        keyId: env.RAZORPAY_KEY_ID,
        order: razorpayOrder,
        paymentStatus: "created",
        feeInr: paymentAmount
      };
    });
  } finally {
    session.endSession();
  }

  if (responsePayload?.team && responsePayload?.paymentStatus) {
    triggerRegistrationSync(responsePayload.team, responsePayload.paymentStatus);
  }

  res.status(responseStatus).json(responsePayload);
});
