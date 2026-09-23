import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { Payment } from "../models/Payment.js";
import { PaymentAudit } from "../models/PaymentAudit.js";
import { Score } from "../models/Score.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { EventSettings } from "../models/EventSettings.js";
import { EventSettingsAudit } from "../models/EventSettingsAudit.js";
import { buildWinnerCertificate } from "../services/certificateService.js";
import { getEventSettings, resetEventSettingsToDefaults, updateEventSettings } from "../services/eventSettingsService.js";
import { countSuccessfulRegisteredParticipants } from "../services/registrationCapacityService.js";
import { logPaymentAudit } from "../services/paymentAuditService.js";
import { sendPaymentApprovalEmail, sendPaymentRejectionEmail, sendRegistrationEmail } from "../services/emailService.js";
import { sendBulkWhatsAppMessages, verifyWhatsAppCredentials } from "../services/whatsappBusinessService.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPaymentProofsDir } from "../utils/uploadPaths.js";
import { AppError } from "../utils/AppError.js";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");

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
      // First, filter for the requested status
      { $match: { status: paymentStatusFilter } },
      // Then sort by createdAt descending to get most recent successful/pending/failed payment
      { $sort: { createdAt: -1 } },
      // Group by teamId and take the first (most recent) one with matching status
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
      // Include payments that are verified by either method:
      // 1. Razorpay: has both paymentId and signature
      // 2. Manual: has paymentApprovedAt (admin approval timestamp)
      { $match: { 
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
            bankDetails: { $first: "$bankDetails" },
            paymentMethod: { $first: "$paymentMethod" },
            paymentProofFile: { $first: "$paymentProofFile" },
            paymentProofSubmittedAt: { $first: "$paymentProofSubmittedAt" },
            paymentApprovedAt: { $first: "$paymentApprovedAt" },
            utrNumber: { $first: "$utrNumber" },
            transactionId: { $first: "$transactionId" }
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
      collegeName: team.collegeName || "N/A",
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
      // Payment proof details
      paymentMethod: payment?.paymentMethod || "online",
      paymentProofFile: payment?.paymentProofFile || null,
      paymentProofUrl: payment?.paymentProofFile ? `/api/admin/teams/${team._id}/payment-proof` : null,
      paymentProofSubmittedAt: payment?.paymentProofSubmittedAt || null,
      paymentApprovedAt: payment?.paymentApprovedAt || null,
      utrNumber: payment?.utrNumber || "",
      transactionId: payment?.transactionId || "",
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
 * GET /admin/teams/:teamId/payment-proof
 * Stream the proof saved on the configured local/Render persistent disk.
 */
export const getTeamPaymentProof = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({
    teamId: req.params.teamId,
    paymentProofFile: { $exists: true, $ne: "" }
  }).sort({ paymentProofSubmittedAt: -1, createdAt: -1 }).lean();

  if (!payment?.paymentProofFile) {
    throw new AppError("Payment proof not found for this team", 404);
  }

  const storedPath = payment.paymentProofFile.split(/[?#]/)[0];
  const filename = path.basename(decodeURIComponent(storedPath));
  const proofPath = path.join(getPaymentProofsDir(), filename);

  if (!fs.existsSync(proofPath)) {
    console.error(`[getTeamPaymentProof] Proof file missing on disk: ${proofPath}`);
    throw new AppError("Payment proof file is no longer available on disk", 404);
  }

  return res.sendFile(proofPath);
});

/**
 * GET /admin/payments/proofs/export
 * Download every payment proof currently saved on the local/Render disk.
 */
export const exportPaymentProofs = asyncHandler(async (_req, res) => {
  const payments = await Payment.find({
    status: "success",
    paymentProofFile: { $exists: true, $ne: "" }
  })
    .sort({ paymentProofSubmittedAt: -1, createdAt: -1 })
    .populate("teamId", "name")
    .lean();

  const files = [];
  const manifestRows = [[
    "Team Name",
    "Team ID",
    "Order ID",
    "Payment Status",
    "Payment Method",
    "UTR / Transaction ID",
    "Submitted At",
    "File Name"
  ]];

  for (const payment of payments) {
    const storedPath = payment.paymentProofFile.split(/[?#]/)[0];
    const filename = path.basename(decodeURIComponent(storedPath));
    const proofPath = path.join(getPaymentProofsDir(), filename);

    if (!fs.existsSync(proofPath)) {
      console.warn(`[exportPaymentProofs] Skipping missing proof: ${proofPath}`);
      continue;
    }

    const teamName = payment.teamId?.name || "Unknown Team";
    const teamId = payment.teamId?._id?.toString() || payment.teamId?.toString() || "unknown-team";
    const safeTeamName = teamName.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "team";
    const archiveName = `${safeTeamName}__${teamId}__${filename}`;

    files.push({ proofPath, archiveName });
    manifestRows.push([
      teamName,
      teamId,
      payment.orderId || "",
      payment.status || "",
      payment.paymentMethod || "",
      payment.utrNumber || payment.transactionId || "",
      payment.paymentProofSubmittedAt?.toISOString?.() || "",
      archiveName
    ]);
  }

  if (files.length === 0) {
    throw new AppError("No payment proof files are available on the Render disk", 404);
  }

  const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const manifest = manifestRows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const archive = new ZipArchive({ zlib: { level: 9 } });

  archive.on("error", (error) => {
    console.error("[exportPaymentProofs] Archive failed:", error.message);
    if (!res.headersSent) {
      res.status(500).end();
    } else {
      res.destroy(error);
    }
  });

  res.attachment("payment-proofs-export.zip");
  archive.pipe(res);
  archive.append(manifest, { name: "payment-proofs-manifest.csv" });
  files.forEach(({ proofPath, archiveName }) => archive.file(proofPath, { name: archiveName }));
  await archive.finalize();
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

  // Check if registrations should be auto-closed (if approved payment brings us to capacity)
  let autoClosedRegistrations = false;
  if (verificationStatus === "approved") {
    const registrationCapacity = Number(env.REGISTRATION_CAPACITY || 160);
    const totalRegistrations = await countSuccessfulRegisteredParticipants();
    
    if (totalRegistrations >= registrationCapacity) {
      console.log(`✅ Registration capacity (${registrationCapacity}) reached with ${totalRegistrations} participants. Auto-closing registrations.`);
      await updateEventSettings({ registrationClosed: true });
      autoClosedRegistrations = true;
    }
  }

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
      approvedBy: req.user._id,
      autoClosedRegistrations
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
    message: `Payment ${verificationStatus} successfully${autoClosedRegistrations ? ' - Registrations auto-closed due to capacity reached' : ''}`,
    payment: {
      _id: payment._id,
      status: payment.status,
      paymentApprovedAt: payment.paymentApprovedAt
    },
    team: {
      _id: payment.teamId._id,
      name: payment.teamId.name
    },
    registrationStatus: {
      autoClosedRegistrations
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
 * DELETE /admin/payments/:paymentId
 * Remove/delete a transaction (payment record)
 * Only admins can delete payments
 */
export const deletePayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { reason } = req.body || {};

  // Find the payment
  const payment = await Payment.findById(paymentId)
    .populate("userId", "name email")
    .populate("teamId", "name");
  
  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  // Store payment info before deletion for audit purposes
  const deletedPaymentInfo = {
    _id: payment._id,
    orderId: payment.orderId,
    userId: payment.userId._id,
    teamId: payment.teamId._id,
    amount: payment.amount,
    status: payment.status,
    paymentMethod: payment.paymentMethod
  };

  // Log audit trail before deletion
  await logPaymentAudit({
    paymentRef: payment._id,
    orderId: payment.orderId,
    userId: payment.userId._id,
    teamId: payment.teamId._id,
    eventType: "PAYMENT_DELETED",
    source: "admin",
    status: "deleted",
    message: `Admin deleted payment transaction`,
    payload: {
      deletedBy: req.user._id,
      deletionReason: reason || "No reason provided",
      paymentDetails: deletedPaymentInfo
    }
  });

  // Delete the payment
  await Payment.findByIdAndDelete(paymentId);

  res.status(200).json({
    message: "Payment transaction deleted successfully",
    deletedPayment: {
      _id: payment._id,
      orderId: payment.orderId,
      amount: payment.amount,
      status: payment.status,
      teamName: payment.teamId.name,
      participantName: payment.userId.name
    },
    notification: {
      type: "success",
      title: "Payment Deleted ✅",
      message: `Payment transaction for ${payment.teamId.name} (₹${payment.amount}) has been removed from the system`,
      reason: reason || null
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
  const missingMobileCount = { leaders: 0, teammates: 0 };

  for (const payment of approvedPayments) {
    if (!payment.teamId || !payment.userId) continue;

    // Add team leader (include even if mobile is missing)
    participants.push({
      name: payment.userId.name,
      mobile: payment.userId.mobile || "NOT PROVIDED",
      email: payment.userId.email,
      teamName: payment.teamId.name,
      participationType: payment.teamId.participationType,
      isTeamLeader: true,
      hasMobile: !!payment.userId.mobile
    });
    if (!payment.userId.mobile) missingMobileCount.leaders++;

    // Add teammates if team
    if (payment.teamId.participationType === "team" && payment.teamId.teammates) {
      for (const teammate of payment.teamId.teammates) {
        participants.push({
          name: teammate.name,
          mobile: teammate.mobile || "NOT PROVIDED",
          email: teammate.email || "",
          teamName: payment.teamId.name,
          participationType: "team",
          isTeamLeader: false,
          hasMobile: !!teammate.mobile
        });
        if (!teammate.mobile) missingMobileCount.teammates++;
      }
    }
  }

  res.status(200).json({
    total: participants.length,
    total_with_mobile: participants.filter(p => p.hasMobile).length,
    total_missing_mobile: missingMobileCount.leaders + missingMobileCount.teammates,
    message: "List of participants to send WhatsApp messages to",
    participants: participants.sort((a, b) => a.name.localeCompare(b.name)),
    note: `${missingMobileCount.leaders} leaders and ${missingMobileCount.teammates} teammates missing mobile numbers`
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

/**
 * Send WhatsApp group link manually to participants
 * Works with or without WhatsApp Business API
 */
export const sendWhatsAppGroupLinkManual = asyncHandler(async (req, res) => {
  const { recipientMobiles } = req.body;

  if (!recipientMobiles || !Array.isArray(recipientMobiles) || recipientMobiles.length === 0) {
    throw new AppError("recipientMobiles array is required with at least one phone number", 400);
  }

  if (!env.WHATSAPP_GROUP_LINK) {
    throw new AppError("WhatsApp group link not configured in environment", 400);
  }

  // Create the message with the group link
  const groupLinkMessage = `🎉 Join the IEEE Hackathon 2026 WhatsApp Group!\n\n${env.WHATSAPP_GROUP_LINK}\n\n📱 Get updates, announcements, and connect with other participants.\nSee you at the hackathon! 🚀`;

  // If Business API is enabled, use it
  if (env.ENABLE_WHATSAPP_BUSINESS_API) {
    try {
      const credentialCheck = await verifyWhatsAppCredentials();
      if (!credentialCheck.valid) {
        throw new AppError(`WhatsApp credential verification failed: ${credentialCheck.error}`, 400);
      }

      const results = await sendBulkWhatsAppMessages(recipientMobiles, groupLinkMessage);

      return res.status(200).json({
        method: "whatsapp_business_api",
        message: "WhatsApp group link sent via Business API",
        totalRequests: results.totalRequests,
        successful: results.successful,
        failed: results.failed,
        summary: results.summary,
        results: results.results,
        groupLink: env.WHATSAPP_GROUP_LINK
      });
    } catch (error) {
      console.error("Error sending via WhatsApp Business API:", error);
      throw new AppError(error.message || "Failed to send WhatsApp messages", 500);
    }
  } else {
    // Without API, return a simpler response with manual sending instructions
    return res.status(200).json({
      method: "manual",
      message: "WhatsApp group link prepared for manual sending",
      groupLink: env.WHATSAPP_GROUP_LINK,
      recipientCount: recipientMobiles.length,
      messageToSend: groupLinkMessage,
      instructions: "Copy the message above and send it to participants manually via WhatsApp",
      recipients: recipientMobiles
    });
  }
});

/**
 * Get participants for email sending (similar to WhatsApp but shows all with email availability)
 */
export const getParticipantsForEmail = asyncHandler(async (req, res) => {
  // Get all teams with approved payments
  const approvedPayments = await Payment.find({ status: "success" })
    .populate("teamId", "name leaderName participationType teammates")
    .populate("userId", "name email mobile");

  const participants = [];
  const missingEmailCount = { leaders: 0, teammates: 0 };

  for (const payment of approvedPayments) {
    if (!payment.teamId || !payment.userId) continue;

    // Add team leader (include even if email is missing)
    participants.push({
      name: payment.userId.name,
      email: payment.userId.email || "NOT PROVIDED",
      mobile: payment.userId.mobile || "",
      teamName: payment.teamId.name,
      participationType: payment.teamId.participationType,
      isTeamLeader: true,
      hasEmail: !!payment.userId.email
    });
    if (!payment.userId.email) missingEmailCount.leaders++;

    // Add teammates if team
    if (payment.teamId.participationType === "team" && payment.teamId.teammates) {
      for (const teammate of payment.teamId.teammates) {
        participants.push({
          name: teammate.name,
          email: teammate.email || "NOT PROVIDED",
          mobile: teammate.mobile || "",
          teamName: payment.teamId.name,
          participationType: "team",
          isTeamLeader: false,
          hasEmail: !!teammate.email
        });
        if (!teammate.email) missingEmailCount.teammates++;
      }
    }
  }

  res.status(200).json({
    total: participants.length,
    total_with_email: participants.filter(p => p.hasEmail).length,
    total_missing_email: missingEmailCount.leaders + missingEmailCount.teammates,
    message: "List of participants to send registration emails to",
    participants: participants.sort((a, b) => a.name.localeCompare(b.name)),
    note: `${missingEmailCount.leaders} leaders and ${missingEmailCount.teammates} teammates missing email addresses`
  });
});

/**
 * Send registration and WhatsApp group link email to selected participants
 */
export const sendRegistrationEmails = asyncHandler(async (req, res) => {
  const { recipientEmails } = req.body;

  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    throw new AppError("recipientEmails array is required with at least one email address", 400);
  }

  // Filter out invalid emails
  const validEmails = recipientEmails.filter(email => email && email !== "NOT PROVIDED" && email.includes("@"));
  
  if (validEmails.length === 0) {
    throw new AppError("No valid email addresses provided", 400);
  }

  if (!env.WHATSAPP_GROUP_LINK) {
    throw new AppError("WhatsApp group link not configured in environment", 400);
  }

  // Get participant details for each email
  const results = {
    successful: 0,
    failed: 0,
    errors: [],
    sentTo: []
  };

  // Find all approved payments to get participant details
  const approvedPayments = await Payment.find({ status: "success" })
    .populate("teamId", "name leaderName")
    .populate("userId", "name email");

  // Create a map of email to participant details
  const emailToParticipant = {};
  for (const payment of approvedPayments) {
    if (payment.userId?.email) {
      emailToParticipant[payment.userId.email] = {
        name: payment.userId.name,
        teamName: payment.teamId?.name || "Individual"
      };
    }
    // Also check teammates
    if (payment.teamId?.teammates) {
      for (const teammate of payment.teamId.teammates) {
        if (teammate.email) {
          emailToParticipant[teammate.email] = {
            name: teammate.name,
            teamName: payment.teamId?.name || "Individual"
          };
        }
      }
    }
  }

  // Send emails to each recipient
  for (const email of validEmails) {
    try {
      const participant = emailToParticipant[email] || { name: "Participant", teamName: "Hackathon" };
      
      await sendPaymentApprovalEmail({
        to: email,
        name: participant.name,
        teamName: participant.teamName,
        amount: 200, // Standard registration fee
        whatsappLink: env.WHATSAPP_GROUP_LINK
      });

      results.successful++;
      results.sentTo.push(email);
    } catch (error) {
      results.failed++;
      results.errors.push({
        email,
        error: error.message
      });
      console.error(`Failed to send email to ${email}:`, error.message);
    }
  }

  res.status(200).json({
    message: "Registration emails sent",
    successful: results.successful,
    failed: results.failed,
    totalRequests: validEmails.length,
    sentTo: results.sentTo,
    errors: results.errors.length > 0 ? results.errors : undefined,
    whatsappGroupLink: env.WHATSAPP_GROUP_LINK
  });
});


