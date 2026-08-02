import { Payment } from "../models/Payment.js";
import { Team } from "../models/Team.js";

export function countTeamParticipantSlots(team) {
  return 1 + (team.teammates?.length || 0);
}

export async function countSuccessfulRegisteredParticipants() {
  const successfulTeamIds = await Payment.distinct("teamId", { status: "success" });

  if (successfulTeamIds.length === 0) {
    return 0;
  }

  const teams = await Team.find({ _id: { $in: successfulTeamIds } }, { teammates: 1 }).lean();
  return teams.reduce((total, team) => total + countTeamParticipantSlots(team), 0);
}

export async function countSuccessfulRegisteredTeams() {
  return Payment.distinct("teamId", { status: "success" }).then((teamIds) => teamIds.length);
}