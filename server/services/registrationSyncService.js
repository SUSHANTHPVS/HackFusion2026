import { env } from "../config/env.js";

function formatAmountInr(amount) {
  return Number.isFinite(amount) ? amount : null;
}

export async function syncRegistrationToGoogle(payload) {
  if (!env.GOOGLE_FORM_WEBHOOK_URL) {
    return;
  }

  try {
    await fetch(env.GOOGLE_FORM_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (_error) {
    // Non-blocking sync. Registration and payment flow should not fail for webhook issues.
  }
}

export function buildRegistrationSyncPayload({ team, user, paymentStatus, feeInr }) {
  return {
    syncedAt: new Date().toISOString(),
    teamId: String(team._id),
    teamName: team.name,
    participationType: team.participationType,
    themeTrack: team.themeTrack,
    teamLeaderName: team.leaderName,
    leaderGender: team.leaderGender,
    rollNo: team.rollNo,
    year: team.year,
    branch: team.branch,
    section: team.section,
    teammateDetails: (team.teammates || []).map((item) => ({
      name: item.name,
      email: item.email,
      gender: item.gender,
      rollNo: item.rollNo,
      year: item.year,
      branch: item.branch,
      section: item.section
    })),
    participantAccount: {
      userId: String(user._id),
      name: user.name,
      email: user.email,
      mobile: user.mobile || ""
    },
    paymentStatus,
    feeInr: formatAmountInr(feeInr)
  };
}
