import { Payment } from "../models/Payment.js";
import { PaymentAudit } from "../models/PaymentAudit.js";
import { Score } from "../models/Score.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { EventSettings } from "../models/EventSettings.js";
import { EventSettingsAudit } from "../models/EventSettingsAudit.js";
import { buildWinnerCertificate } from "../services/certificateService.js";
import { getEventSettings, resetEventSettingsToDefaults, updateEventSettings } from "../services/eventSettingsService.js";
import { logPaymentAudit } from "../services/paymentAuditService.js";
import { sendPaymentApprovalEmail, sendPaymentRejectionEmail, sendRegistrationEmail } from "../services/emailService.js";
import { sendBulkWhatsAppMessages, verifyWhatsAppCredentials } from "../services/whatsappBusinessService.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

function buildReceipt(prefix, id) {
  const compactPrefix = String(prefix || "RP").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) || "RP";
  const timePart = Date.now().toString(36);
  const idPart = String(id || "anon").replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "anon";
  const randomPart = Math.random().toString(36).slice(2, 6);
  return `${compactPrefix}${timePart}${idPart}${randomPart}`.slice(0, 40);
}

export const dashboardStats = asyncHandler(async (_req, res) => {
  const [participants, teams, paid, checkedIn, ieeeMembers] = await Promise.all([
    User.countDocuments({ role: "participant" }),
    Team.countDocuments(),
    Payment.countDocuments({ status: "success" }),
    User.countDocuments({ checkedIn: true }),
    User.countDocuments({ ieeeMember: true, role: "participant" })
  ]);

  const revenue = await Payment.aggregate([
    { $match: { status: "success" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const byDepartment = await User.aggregate([
    { $match: { role: "participant" } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    participants,
    teams,
    revenue: revenue[0]?.total || 0,
    payments: paid,
    departments: byDepartment,
    ieeeMembers,
    checkedInTeams: checkedIn
  });
});

export const registrationsTimeline = asyncHandler(async (_req, res) => {
  const timeline = await User.aggregate([
    { $match: { role: "participant" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json({ timeline });
});

export const generateWinnerCertificate = asyncHandler(async (req, res) => {
  const pdfBuffer = await buildWinnerCertificate({
    winnerName: req.body.winnerName,
    teamName: req.body.teamName
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=winner-certificate.pdf");
  res.send(pdfBuffer);
});

export const listPaymentRecoveryQueue = asyncHandler(async (req, res) => {
  const status = req.query.status || "created,failed";
  const statuses = status.split(",").map((item) => item.trim()).filter(Boolean);
  const limit = Math.min(Number(req.query.limit || 50), 200);

  const queue = await Payment.find({ status: { $in: statuses } })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate("userId", "name email department")
    .populate("teamId", "name themeTrack");

  res.json({ queue });
});

export const paymentAuditTrail = asyncHandler(async (req, res) => {
  const logs = await PaymentAudit.find({ orderId: req.params.orderId })
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ orderId: req.params.orderId, logs });
});

export const recentWebhookEvents = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
  const status = String(req.query.status || "").trim();
  const eventType = String(req.query.eventType || "").trim();

  const filter = { source: "webhook" };
  if (status) {
    filter.status = status;
  }
  if (eventType) {
    filter.eventType = eventType;
  }

  const logs = await PaymentAudit.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name email")
    .populate("teamId", "name");

  res.json({
    total: logs.length,
    limit,
    filters: {
      status: status || null,
      eventType: eventType || null
    },
    logs
  });
});

export const searchRegistrations = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();
  const paymentStatusFilter = String(req.query.paymentStatus || "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 300);

  // When filtering by payment status, get teams with verified payments
  // A payment is considered verified if:
  // 1. Razorpay: has both paymentId AND signature
  // 2. Manual: has paymentApprovedAt set (admin approved)
  let allowedTeamIds = null;
  if (paymentStatusFilter) {
    const verifiedPayments = await Payment.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$teamId",
          status: { $first: "$status" },
          paymentId: { $first: "$paymentId" },
          signature: { $first: "$signature" },
          paymentApprovedAt: { $first: "$paymentApprovedAt" },
          orderId: { $first: "$orderId" }
        }
      },
      // Include payments that match the status AND are verified by either method:
      // 1. Razorpay: has both paymentId and signature
      // 2. Manual: has paymentApprovedAt (admin approval timestamp)
      { $match: { 
        status: paymentStatusFilter,
        $or: [
          { paymentId: { $exists: true, $ne: null }, signature: { $exists: true, $ne: null } },
          { paymentApprovedAt: { $exists: true, $ne: null } }
        ]
      } }
    ]);
    
    allowedTeamIds = verifiedPayments.map((item) => item._id);
    console.log(`[searchRegistrations] PaymentStatusFilter: ${paymentStatusFilter}, Found ${allowedTeamIds.length} teams with verified payments (Razorpay + Manual)`);
    console.log(`[searchRegistrations] Verified Team IDs:`, allowedTeamIds.map(id => id.toString()));
  }

  const teamFilter = {};

  // Restrict to allowed teamIds when a payment status filter is active.
  if (allowedTeamIds !== null) {
    teamFilter._id = { $in: allowedTeamIds };
  }

  if (query) {
    const regex = new RegExp(query, "i");
    teamFilter.$or = [
      { name: regex },
      { leaderName: regex },
      { rollNo: regex },
      { year: regex },
      { branch: regex },
      { section: regex },
      { "teammates.name": regex },
      { "teammates.rollNo": regex },
      { "teammates.year": regex },
      { "teammates.branch": regex },
      { "teammates.section": regex }
    ];
  }

  const teams = await Team.find(teamFilter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("leader", "name email mobile checkedIn ieeeMember ieeeMemberId")
    .lean();

  const teamIds = teams.map((item) => item._id);
  const latestPayments = teamIds.length
    ? await Payment.aggregate([
        { $match: { teamId: { $in: teamIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$teamId",
            status: { $first: "$status" },
            amount: { $first: "$amount" },
            currency: { $first: "$currency" },
            orderId: { $first: "$orderId" },
            paymentId: { $first: "$paymentId" },
            updatedAt: { $first: "$updatedAt" },
            bankDetails: { $first: "$bankDetails" }
          }
        }
      ])
    : [];

  const paymentMap = new Map(
    latestPayments.map((item) => [String(item._id), item])
  );

  const rows = teams.map((team) => {
    const payment = paymentMap.get(String(team._id)) || null;
    const paymentStatus = payment?.status || "not-started";

    return {
      teamId: team._id,
      teamName: team.name,
      participationType: team.participationType,
      themeTrack: team.themeTrack,
      teamLeaderName: team.leaderName,
      rollNo: team.rollNo,
      year: team.year,
      branch: team.branch,
      section: team.section,
      ieeeMember: Boolean(team.leader?.ieeeMember),
      ieeeMemberId: team.leader?.ieeeMemberId || "",
      teammates: (team.teammates || []).map((member) => ({
        name: member.name,
        rollNo: member.rollNo,
        year: member.year,
        branch: member.branch,
        section: member.section,
        ieeeMember: Boolean(member.ieeeMember),
        ieeeMemberId: member.ieeeMemberId || "",
        checkedIn: Boolean(member.checkedIn)
      })),
      accountName: team.leader?.name || "",
      leaderId: team.leader?._id || null,
      accountEmail: team.leader?.email || "",
      accountMobile: team.leader?.mobile || "",
      checkedIn: Boolean(team.leader?.checkedIn),
      paymentStatus,
      participationConfirmed: paymentStatus === "success",
      paymentAmountInr: payment?.amount || null,
      paymentCurrency: payment?.currency || "INR",
      orderId: payment?.orderId || "",
      paymentId: payment?.paymentId || "",
      paymentUpdatedAt: payment?.updatedAt || null,
      // Bank details for refund processing
      bankDetails: payment?.bankDetails || team.bankDetails || null,
      teamBankDetails: team.bankDetails || null,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
    };
  });

  res.json({
    total: rows.length,
    filters: {
      q: query,
      paymentStatus: paymentStatusFilter || null,
      limit
    },
    rows
  });
});

/**
 * DELETE /admin/teams/:teamId
 * Remove a team and all associated records (payments, scores)
 * Admin only
 */
export const deleteTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  // Validate team ID
  if (!teamId) {
    throw new AppError("Team ID is required", 400);
  }

  // Find the team
  const team = await Team.findById(teamId);
  if (!team) {
    throw new AppError("Team not found", 404);
  }

  const deletedCount = {
    team: 0,
    payments: 0,
    scores: 0,
    paymentAudits: 0
  };

  // Delete associated payments
  const paymentDeleteResult = await Payment.deleteMany({ teamId });
  deletedCount.payments = paymentDeleteResult.deletedCount || 0;

  // Delete associated payment audits
  const auditDeleteResult = await PaymentAudit.deleteMany({ teamId });
  deletedCount.paymentAudits = auditDeleteResult.deletedCount || 0;

  // Delete associated scores
  const scoreDeleteResult = await Score.deleteMany({ teamId });
  deletedCount.scores = scoreDeleteResult.deletedCount || 0;

  // Delete the team itself
  await Team.deleteOne({ _id: teamId });
  deletedCount.team = 1;

  console.log(`[deleteTeam] Removed team "${team.name}" (${teamId}) and associated records:`, deletedCount);

  res.json({
    message: `Team "${team.name}" and all associated records have been removed.`,
    team: {
      _id: team._id,
      name: team.name,
      leaderName: team.leaderName
    },
    deletedRecords: deletedCount
  });
});

export const listJudges = asyncHandler(async (_req, res) => {
  const judges = await User.find({ role: "judge" })
    .sort({ createdAt: -1 })
    .select("name email department authProvider createdAt")
    .lean();

  const judgeIds = judges.map((item) => item._id);
  const scoreStats = judgeIds.length
    ? await Score.aggregate([
        { $match: { judgeId: { $in: judgeIds } } },
        {
          $group: {
            _id: "$judgeId",
            teamsScored: { $sum: 1 },
            averageScoreGiven: { $avg: "$total" }
          }
        }
      ])
    : [];

  const scoreMap = new Map(scoreStats.map((item) => [String(item._id), item]));

  res.json({
    judges: judges.map((judge) => {
      const stats = scoreMap.get(String(judge._id));
      return {
        ...judge,
        teamsScored: stats?.teamsScored || 0,
        averageScoreGiven: stats?.averageScoreGiven ? Number(stats.averageScoreGiven.toFixed(2)) : null
      };
    })
  });
});

export const upsertJudge = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const name = String(req.body.name || "").trim();
  const department = String(req.body.department || "").trim();
  const password = req.body.password ? String(req.body.password) : undefined;

  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    if (!password) {
      return res.status(400).json({ message: "Password is required when creating a new judge account." });
    }

    user = await User.create({
      name,
      email,
      password,
      role: "judge",
      department: department || "General",
      authProvider: "local",
      ieeeMember: false
    });

    return res.status(201).json({
      message: "Judge account created.",
      judge: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  }

  user.role = "judge";
  if (name) {
    user.name = name;
  }
  if (department) {
    user.department = department;
  }
  if (password && user.authProvider === "local") {
    user.password = password;
  }

  await user.save();

  res.json({
    message: "User promoted/updated as judge.",
    judge: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    }
  });
});

export const getAdminSettings = asyncHandler(async (_req, res) => {
  const settings = await getEventSettings();
  res.json(settings);
});

export const getAdminSettingsHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const logs = await EventSettingsAudit.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("changedBy", "name email role")
    .lean();

  res.json({
    total: logs.length,
    limit,
    logs
  });
});

export const updateAdminSettings = asyncHandler(async (req, res) => {
  const before = await getEventSettings();
  const settings = await updateEventSettings(req.body);

  // Keep runtime env values aligned with persisted settings for modules that still read env directly.
  env.REGISTRATION_CLOSED = settings.registrationClosed;

  await EventSettingsAudit.create({
    action: "update",
    changedBy: req.user?._id,
    changedByEmail: req.user?.email || "",
    before,
    after: settings
  });

  res.json({
    message: "Settings saved persistently.",
    ...settings
  });
});

export const resetAdminSettings = asyncHandler(async (req, res) => {
  const before = await getEventSettings();
  const settings = await resetEventSettingsToDefaults();

  env.REGISTRATION_CLOSED = settings.registrationClosed;

  await EventSettingsAudit.create({
    action: "reset",
    changedBy: req.user?._id,
    changedByEmail: req.user?.email || "",
    before,
    after: settings
  });

  res.json({
    message: "Settings reset to defaults and saved persistently.",
    ...settings
  });
});

export const getPaymentVerificationStatus = asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  // Build query
  let query = {};
  
  // Filter by status if provided
  if (status) {
    query.status = status;
  }

  // Get payments with populated user and team details
  let paymentQuery = Payment.find(query)
    .populate("userId", "name email mobile")
    .populate("teamId", "name leaderName")
    .sort({ createdAt: -1 });

  let payments = await paymentQuery.lean();

  // Filter by search query if provided (search by team name or user name)
  if (search) {
    const searchLower = search.toLowerCase();
    payments = payments.filter((p) => {
      const teamName = p.teamId?.name?.toLowerCase() || "";
      const userName = p.userId?.name?.toLowerCase() || "";
      const leaderName = p.teamId?.leaderName?.toLowerCase() || "";
      
      return (
        teamName.includes(searchLower) ||
        userName.includes(searchLower) ||
        leaderName.includes(searchLower)
      );
    });
  }

  // Format response
  const formattedPayments = payments.map((payment) => ({
    _id: payment._id,
    status: payment.status,
    amount: payment.amount,
    createdAt: payment.createdAt,
    paymentProofFile: payment.paymentProofFile,
    paymentApprovedAt: payment.paymentApprovedAt,
    paymentApprovedBy: payment.paymentApprovedBy,
    rejectionReason: payment.rejectionReason,
    userId: payment.userId,
    teamId: payment.teamId,
    paymentMethod: payment.paymentMethod,
    utrNumber: payment.utrNumber
  }));

  res.json({
    total: formattedPayments.length,
    payments: formattedPayments
  });
});

export const diagnosisTeamsWithPayments = asyncHandler(async (req, res) => {
  // Get ALL teams with their payment information - for debugging
  const allTeams = await Team.find({})
    .select("name leaderName leader")
    .populate("leader", "name email");

  const teamsData = [];
  for (const team of allTeams) {
    const payment = await Payment.findOne({ teamId: team._id })
      .sort({ createdAt: -1 })
      .select("status paymentId signature orderId amount");
    
    teamsData.push({
      teamId: team._id,
      teamName: team.name,
      leaderName: team.leaderName,
      leaderEmail: team.leader?.email || "Unknown",
      leaderId: team.leader?._id || null,
      payment: payment ? {
        status: payment.status,
        hasPaymentId: !!payment.paymentId,
        hasSignature: !!payment.signature,
        orderId: payment.orderId,
        amount: payment.amount
      } : null,
      willAppearInRegistrations: payment && payment.status === "success" && payment.paymentId && payment.signature
    });
  }

  res.json({
    total: teamsData.length,
    teams: teamsData
  });
});

/**
 * PATCH /admin/payments/:paymentId/verify
 * Verify and approve/reject manual payment
 */
export const verifyManualPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { verificationStatus, adminNotes } = req.body;

  if (!["approved", "rejected"].includes(verificationStatus)) {
    throw new AppError("Verification status must be 'approved' or 'rejected'", 400);
  }

  const payment = await Payment.findById(paymentId).populate("userId", "name email").populate("teamId", "name");
  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.status !== "pending_verification") {
    throw new AppError("Only pending payments can be verified", 400);
  }

  // Update payment
  payment.status = verificationStatus === "approved" ? "success" : "failed";
  payment.paymentApprovedBy = req.user._id;
  payment.paymentApprovedAt = new Date();
  if (adminNotes) {
    payment.rejectionReason = adminNotes;
  }

  await payment.save();

  // Log audit
  await logPaymentAudit({
    paymentRef: payment._id,
    orderId: payment.orderId,
    userId: payment.userId._id,
    teamId: payment.teamId._id,
    eventType: `MANUAL_PAYMENT_${verificationStatus.toUpperCase()}`,
    source: "admin",
    status: verificationStatus === "approved" ? "success" : "failed",
    message: `Admin ${verificationStatus} manual payment verification`,
    payload: {
      verificationStatus,
      adminNotes,
      approvedBy: req.user._id
    }
  });

  // Send notification email to participant (non-blocking - fire and forget)
  // Don't await this, just let it happen in the background
  if (verificationStatus === "approved") {
    // Payment approved - send both approval confirmation and registration email
    const whatsappLink = env.WHATSAPP_GROUP_LINK || "https://chat.whatsapp.com/FrJNyMIjzkB3mNs6Dgg9qc";
    
    // Send payment approval email with WhatsApp link
    sendPaymentApprovalEmail({
      to: payment.userId.email,
      name: payment.userId.name,
      teamName: payment.teamId.name,
      amount: payment.amount,
      whatsappLink
    }).catch((emailError) => {
      // Log email error but don't fail the payment verification
      console.error("Failed to send payment approval email:", emailError.message);
    });
    
    // Also send registration confirmation email
    sendRegistrationEmail({
      to: payment.userId.email,
      name: payment.userId.name,
      teamName: payment.teamId.name
    }).catch((emailError) => {
      // Log email error but don't fail the payment verification
      console.error("Failed to send registration confirmation email:", emailError.message);
    });
  } else {
    // Payment rejected - send rejection notice
    sendPaymentRejectionEmail({
      to: payment.userId.email,
      name: payment.userId.name,
      teamName: payment.teamId.name,
      reason: adminNotes || "Payment proof did not meet verification criteria"
    }).catch((emailError) => {
      // Log email error but don't fail the payment verification
      console.error("Failed to send payment rejection email:", emailError.message);
    });
  }

  res.status(200).json({
    message: `Payment ${verificationStatus} successfully`,
    payment: {
      _id: payment._id,
      status: payment.status,
      paymentApprovedAt: payment.paymentApprovedAt
    },
    team: {
      _id: payment.teamId._id,
      name: payment.teamId.name
    },
    notification: {
      type: verificationStatus === "approved" ? "success" : "failed",
      title: verificationStatus === "approved" ? "Payment Approved ✅" : "Payment Rejected ❌",
      message: verificationStatus === "approved" 
        ? "Participant has been notified via email and can now access the WhatsApp group"
        : "Participant has been notified of rejection and can resubmit",
      emailSent: true
    }
  });
});

/**
 * Get WhatsApp group link for admin to share
 */
export const getWhatsAppGroupLink = asyncHandler(async (_req, res) => {
  const whatsappLink = env.WHATSAPP_GROUP_LINK || "https://chat.whatsapp.com/FrJNyMIjzkB3mNs6Dgg9qc";

  if (!whatsappLink) {
    throw new AppError("WhatsApp group link not configured", 404);
  }

  res.status(200).json({
    groupLink: whatsappLink,
    message: "Share this link with participants via your WhatsApp",
    shareMessage: `🎉 Join the IEEE Hackathon 2026 WhatsApp Group!\n\n${whatsappLink}\n\n📱 Get updates, announcements, and connect with other participants. See you at the hackathon! 🚀`
  });
});

/**
 * Get list of participants who have paid (for WhatsApp message targeting)
 */
export const getParticipantsForWhatsApp = asyncHandler(async (req, res) => {
  // Get all teams with approved payments
  const approvedPayments = await Payment.find({ status: "success" })
    .populate("teamId", "name leaderName participationType teammates")
    .populate("userId", "name email mobile");

  const participants = [];

  for (const payment of approvedPayments) {
    if (!payment.teamId || !payment.userId) continue;

    // Add team leader
    if (payment.userId.mobile) {
      participants.push({
        name: payment.userId.name,
        mobile: payment.userId.mobile,
        email: payment.userId.email,
        teamName: payment.teamId.name,
        participationType: payment.teamId.participationType,
        isTeamLeader: true
      });
    }

    // Add teammates if team
    if (payment.teamId.participationType === "team" && payment.teamId.teammates) {
      for (const teammate of payment.teamId.teammates) {
        if (teammate.mobile) {
          participants.push({
            name: teammate.name,
            mobile: teammate.mobile,
            email: teammate.email || "",
            teamName: payment.teamId.name,
            participationType: "team",
            isTeamLeader: false
          });
        }
      }
    }
  }

  res.status(200).json({
    total: participants.length,
    message: "List of participants to send WhatsApp messages to",
    participants: participants.sort((a, b) => a.name.localeCompare(b.name))
  });
});

/**
 * Send WhatsApp message to single or multiple participants
 * Requires WhatsApp Business API to be configured
 */
export const sendWhatsAppToParticipants = asyncHandler(async (req, res) => {
  if (!env.ENABLE_WHATSAPP_BUSINESS_API) {
    throw new AppError("WhatsApp Business API is not enabled. Configure it in admin settings.", 400);
  }

  const { recipientMobiles, message } = req.body;

  if (!recipientMobiles || !Array.isArray(recipientMobiles) || recipientMobiles.length === 0) {
    throw new AppError("recipientMobiles array is required with at least one phone number", 400);
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    throw new AppError("message is required and cannot be empty", 400);
  }

  if (recipientMobiles.length > 100) {
    throw new AppError("Maximum 100 recipients per request. Use multiple requests for bulk sending.", 400);
  }

  try {
    // Verify credentials first
    const credentialCheck = await verifyWhatsAppCredentials();
    if (!credentialCheck.valid) {
      throw new AppError(`WhatsApp credential verification failed: ${credentialCheck.error}`, 400);
    }

    // Send messages to all recipients
    const results = await sendBulkWhatsAppMessages(recipientMobiles, message);

    res.status(200).json({
      message: "WhatsApp messages sent",
      totalRequests: results.totalRequests,
      successful: results.successful,
      failed: results.failed,
      summary: results.summary,
      results: results.results,
      credentialsVerified: true,
      phoneNumberId: credentialCheck.phoneNumberId
    });
  } catch (error) {
    console.error("Error sending WhatsApp messages:", error);
    throw new AppError(error.message || "Failed to send WhatsApp messages", 500);
  }
});

/**
 * Check WhatsApp Business API credentials
 */
export const checkWhatsAppBusinessCredentials = asyncHandler(async (_req, res) => {
  if (!env.WHATSAPP_BUSINESS_API_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return res.status(200).json({
      configured: false,
      message: "WhatsApp Business API credentials not configured"
    });
  }

  try {
    const result = await verifyWhatsAppCredentials();
    
    res.status(200).json({
      configured: true,
      valid: result.valid,
      ...result
    });
  } catch (error) {
    res.status(200).json({
      configured: true,
      valid: false,
      error: error.message
    });
  }
});


