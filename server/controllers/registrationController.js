import { Payment } from "../models/Payment.js";
import { Team } from "../models/Team.js";
import { createOrder } from "../services/razorpayService.js";
import { env } from "../config/env.js";
import { getEventSettings } from "../services/eventSettingsService.js";
import { countSuccessfulRegisteredParticipants, countSuccessfulRegisteredTeams } from "../services/registrationCapacityService.js";
import { buildRegistrationSyncPayload, syncRegistrationToGoogle } from "../services/registrationSyncService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function normalizeName(value = "") {
  return value.trim().toLowerCase();
}

function normalizeRoll(value = "") {
  return value.trim().toUpperCase();
}

function buildReceipt(prefix, id) {
  const compactPrefix = String(prefix || "RP").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) || "RP";
  const timePart = Date.now().toString(36);
  const idPart = String(id || "anon").replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "anon";
  const randomPart = Math.random().toString(36).slice(2, 6);
  return `${compactPrefix}${timePart}${idPart}${randomPart}`.slice(0, 40);
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
    .map((item) => `${normalizeName(item.name)}|${item.gender}|${normalizeRoll(item.rollNo)}|${String(item.mobile || "").trim()}`)
    .sort();
  const incomingTeammates = normalizedTeammates
    .map((item) => `${normalizeName(item.name)}|${String(item.email || "").trim().toLowerCase()}|${item.gender}|${normalizeRoll(item.rollNo)}|${String(item.mobile || "").trim()}`)
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
    const mobile = String(teammate.mobile || "").trim();

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

    if (!/^\d{10}$/.test(mobile)) {
      throw new AppError("Each teammate mobile number must contain exactly 10 digits.", 400);
    }
  }
}

function buildIncomingMemberSets(participantDetails, normalizedTeammates) {
  const incomingRollNos = new Set([normalizeRoll(participantDetails.rollNo)]);
  const incomingNames = new Set([normalizeName(participantDetails.teamLeaderName)]);

  for (const teammate of normalizedTeammates) {
    incomingRollNos.add(normalizeRoll(teammate.rollNo));
    incomingNames.add(normalizeName(teammate.name));
  }

  return { incomingRollNos, incomingNames };
}

async function validateNoDuplicateMembersAcrossRegistrations(participantDetails, normalizedTeammates, existingTeamId) {
  const { incomingRollNos, incomingNames } = buildIncomingMemberSets(participantDetails, normalizedTeammates);

  const existingTeams = await Team.find(
    existingTeamId ? { _id: { $ne: existingTeamId } } : {},
    { name: 1, leaderName: 1, rollNo: 1, teammates: 1 }
  ).lean();

  for (const team of existingTeams) {
    const leaderRollNo = normalizeRoll(team.rollNo);
    const leaderName = normalizeName(team.leaderName);

    if (incomingRollNos.has(leaderRollNo)) {
      throw new AppError(`Roll number ${team.rollNo} is already registered with team ${team.name}.`, 409);
    }

    if (incomingNames.has(leaderName)) {
      throw new AppError(`Name ${team.leaderName} is already registered with team ${team.name}.`, 409);
    }

    for (const teammate of team.teammates || []) {
      const teammateRollNo = normalizeRoll(teammate.rollNo);
      const teammateName = normalizeName(teammate.name);

      if (incomingRollNos.has(teammateRollNo)) {
        throw new AppError(`Roll number ${teammate.rollNo} is already registered with team ${team.name}.`, 409);
      }

      if (incomingNames.has(teammateName)) {
        throw new AppError(`Name ${teammate.name} is already registered with team ${team.name}.`, 409);
      }
    }
  }
}

export const createTeamAndOrder = asyncHandler(async (req, res) => {
  const eventSettings = await getEventSettings();
  const registrationCapacity = Number(env.REGISTRATION_CAPACITY || 125);
  const participationType = req.body.participationType;

  // Debug: Log the entire request body
  console.log("🔍 FULL Request received at /registration/team:");
  console.log(JSON.stringify(req.body, null, 2));

  // Validate all required fields exist and are not empty
  const requiredFields = ['teamName', 'teamLeaderName', 'collegeName', 'leaderGender', 'rollNo', 'year', 'branch', 'section', 'themeTrack'];
  const missingFields = [];
  
  for (const field of requiredFields) {
    const value = req.body[field];
    
    // Convert to string if not already, then trim and check if empty
    const stringValue = String(value || '').trim();
    if (!stringValue) {
      missingFields.push({
        field,
        value,
        stringValue,
        type: typeof value
      });
      console.error(`❌ Field "${field}" is empty or missing:`, { value, stringValue, type: typeof value });
    }
  }

  if (missingFields.length > 0) {
    console.error("❌ Missing fields summary:", missingFields);
    throw new AppError(`Missing required fields: ${missingFields.map(f => f.field).join(', ')}`, 400);
  }

  // Separately validate teammates array
  if (!req.body.teammates || !Array.isArray(req.body.teammates) || req.body.teammates.length === 0) {
    console.error("❌ Teammates validation failed:", { 
      hasTeammates: !!req.body.teammates, 
      isArray: Array.isArray(req.body.teammates),
      length: req.body.teammates?.length
    });
    throw new AppError(`Missing required field: teammates`, 400);
  }

  const normalizedTeammates = (req.body.teammates || []).map((item) => {
    if (!item.name || !item.email || !item.rollNo || !item.year || !item.branch || !item.section) {
      throw new AppError("All teammate fields must be filled: name, email, rollNo, year, branch, section", 400);
    }
    return {
      name: String(item.name).trim(),
      email: String(item.email).trim().toLowerCase(),
      gender: item.gender || "",
      rollNo: String(item.rollNo).trim().toUpperCase(),
      mobile: String(item.mobile || "").trim(),
      year: String(item.year).trim(),
      branch: String(item.branch).trim(),
      section: String(item.section).trim().toUpperCase(),
      ieeeMember: Boolean(item.ieeeMember),
      ieeeMemberId: item.ieeeMember ? String(item.ieeeMemberId || "").trim() : ""
    };
  });
  const participantDetails = {
    teamName: String(req.body.teamName).trim(),
    teamLeaderName: String(req.body.teamLeaderName).trim(),
    collegeName: String(req.body.collegeName).trim(),
    leaderGender: req.body.leaderGender,
    rollNo: String(req.body.rollNo).trim().toUpperCase(),
    year: String(req.body.year).trim(),
    branch: String(req.body.branch).trim(),
    section: String(req.body.section).trim().toUpperCase()
  };
  const paymentAmount = 200;
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

  if (participationType !== "team") {
    throw new AppError("Only team registration is allowed.", 400);
  }

  if (normalizedTeammates.length < 2 || normalizedTeammates.length > 3) {
    throw new AppError("Team registration must have 2 to 3 teammates (3 to 4 members including leader).", 400);
  }

  const incomingTeamSlots = 1 + normalizedTeammates.length;

  const existingTeam = await Team.findOne({ leader: req.user._id });

  if (!existingTeam) {
    const totalRegistrations = await countSuccessfulRegisteredParticipants();

    if (eventSettings.registrationClosed || totalRegistrations + incomingTeamSlots > registrationCapacity) {
      throw new AppError("Registrations are full. Please contact the organizers.", 403);
    }
  }

  validateNoDuplicateMembers(participantDetails, normalizedTeammates);
  await validateNoDuplicateMembersAcrossRegistrations(participantDetails, normalizedTeammates, existingTeam?._id);

  if (existingTeam && eventSettings.registrationClosed) {
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
    existingTeam.collegeName = participantDetails.collegeName;
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

  const receipt = buildReceipt("IEEE", req.user._id);

  // Check payment method from env config
  const paymentMethod = env.PAYMENT_METHOD || "razorpay";

  let razorpayOrder;
  if (paymentMethod === "razorpay") {
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
              collegeName: participantDetails.collegeName,
              leaderGender: participantDetails.leaderGender,
              rollNo: participantDetails.rollNo,
              year: participantDetails.year,
              branch: participantDetails.branch,
              section: participantDetails.section,
              members: [req.user._id],
              participationType,
              teammates: normalizedTeammates,
              themeTrack: req.body.themeTrack,
              bankDetails: req.body.bankDetails || undefined
            }
          ],
          { session }
        );
      } else {
        team.name = participantDetails.teamName;
        team.leaderName = participantDetails.teamLeaderName;
        team.collegeName = participantDetails.collegeName;
        team.leaderGender = participantDetails.leaderGender;
        team.rollNo = participantDetails.rollNo;
        team.year = participantDetails.year;
        team.branch = participantDetails.branch;
        team.section = participantDetails.section;
        team.themeTrack = req.body.themeTrack;
        team.participationType = participationType;
        team.teammates = normalizedTeammates;
        if (req.body.bankDetails) {
          team.bankDetails = req.body.bankDetails;
        }
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
            orderId: paymentMethod === "razorpay" ? razorpayOrder.id : `MANUAL-${Date.now()}`,
            amount: paymentAmount,
            participationType,
            status: paymentMethod === "razorpay" ? "created" : "pending_verification",
            paymentMethod: paymentMethod === "razorpay" ? "online" : "manual_bank_transfer",
            bankDetails: req.body.bankDetails || undefined
          }
        ],
        { session }
      );

      // Build response based on payment method
      if (paymentMethod === "razorpay") {
        responsePayload = {
          message: "Team created. Proceed to payment.",
          team,
          keyId: env.RAZORPAY_KEY_ID,
          order: razorpayOrder,
          paymentStatus: "created",
          feeInr: paymentAmount
        };
      } else {
        // Manual payment mode
        responsePayload = {
          message: "Team created. Please submit payment proof.",
          team,
          paymentStatus: "pending_verification",
          feeInr: paymentAmount,
          bankDetails: {
            accountHolder: env.COLLEGE_ACCOUNT_HOLDER,
            accountNumber: env.COLLEGE_ACCOUNT_NUMBER,
            ifscCode: env.COLLEGE_IFSC_CODE,
            bankName: env.COLLEGE_BANK_NAME
          }
        };
      }
    });
  } finally {
    session.endSession();
  }

  if (responsePayload?.team && responsePayload?.paymentStatus) {
    triggerRegistrationSync(responsePayload.team, responsePayload.paymentStatus);
  }

  res.status(responseStatus).json(responsePayload);
});

export const getRegistrationStatus = asyncHandler(async (_req, res) => {
  const registrationCapacity = Number(env.REGISTRATION_CAPACITY || 125);
  const [totalParticipants, totalTeams, eventSettings] = await Promise.all([
    countSuccessfulRegisteredParticipants(),
    countSuccessfulRegisteredTeams(),
    getEventSettings()
  ]);
  const remaining = Math.max(registrationCapacity - totalParticipants, 0);

  res.json({
    capacity: registrationCapacity,
    registered: totalParticipants,
    registeredTeams: totalTeams,
    remaining,
    registrationClosed: Boolean(eventSettings.registrationClosed) || remaining === 0
  });
});
