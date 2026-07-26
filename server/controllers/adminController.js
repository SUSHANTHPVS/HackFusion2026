import { Payment } from "../models/Payment.js";
import { PaymentAudit } from "../models/PaymentAudit.js";
import { Score } from "../models/Score.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { EventSettingsAudit } from "../models/EventSettingsAudit.js";
import { buildWinnerCertificate } from "../services/certificateService.js";
import { getEventSettings, resetEventSettingsToDefaults, updateEventSettings } from "../services/eventSettingsService.js";
import { logPaymentAudit } from "../services/paymentAuditService.js";
import { createOrder } from "../services/razorpayService.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

export const createRecoveryOrder = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.paymentId);
  if (!payment) {
    return res.status(404).json({ message: "Payment record not found" });
  }

  if (payment.status === "success") {
    return res.status(409).json({ message: "Payment already successful, recovery not needed" });
  }

  let participationType = payment.participationType;
  if (!participationType) {
    const team = await Team.findById(payment.teamId).select("participationType teammates");
    participationType = team?.participationType || ((team?.teammates?.length || 0) > 0 ? "team" : "individual");
  }

  const receipt = buildReceipt("REC", payment.userId);
  const razorpayOrder = await createOrder({
    amount: payment.amount * 100,
    receipt,
    notes: {
      recoveryOrderFor: String(payment._id),
      userId: String(payment.userId),
      participationType
    }
  });

  const newPayment = await Payment.create({
    userId: payment.userId,
    teamId: payment.teamId,
    orderId: razorpayOrder.id,
    amount: payment.amount,
    participationType,
    currency: payment.currency || "INR",
    status: "created"
  });

  await logPaymentAudit({
    paymentRef: newPayment._id,
    orderId: newPayment.orderId,
    userId: newPayment.userId,
    teamId: newPayment.teamId,
    eventType: "RECOVERY_ORDER_CREATED",
    source: "admin",
    status: "success",
    message: "Admin created recovery order for failed/pending payment",
    payload: { previousOrderId: payment.orderId }
  });

  res.status(201).json({
    message: "Recovery order created",
    previousOrderId: payment.orderId,
    payment: newPayment,
    keyId: env.RAZORPAY_KEY_ID,
    order: razorpayOrder
  });
});

export const searchRegistrations = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();
  const paymentStatusFilter = String(req.query.paymentStatus || "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 300);

  const teamFilter = {};
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
    .populate("leader", "name email mobile checkedIn")
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
            updatedAt: { $first: "$updatedAt" }
          }
        }
      ])
    : [];

  const paymentMap = new Map(
    latestPayments.map((item) => [String(item._id), item])
  );

  const rows = teams
    .map((team) => {
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
        teammates: (team.teammates || []).map((member) => ({
          name: member.name,
          rollNo: member.rollNo,
          year: member.year,
          branch: member.branch,
          section: member.section
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
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      };
    })
    .filter((item) => !paymentStatusFilter || item.paymentStatus === paymentStatusFilter);

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
  env.INDIVIDUAL_FEE_INR = settings.individualFeeInr;
  env.TEAM_FEE_INR = settings.teamFeeInr;

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
  env.INDIVIDUAL_FEE_INR = settings.individualFeeInr;
  env.TEAM_FEE_INR = settings.teamFeeInr;

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
