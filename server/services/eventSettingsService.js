import { env } from "../config/env.js";
import { EventSettings } from "../models/EventSettings.js";

const SETTINGS_KEY = "primary";

export function getDefaultEventSettings() {
  const registrationClosedRaw = String(process.env.REGISTRATION_CLOSED || "false").trim().toLowerCase();
  const registrationClosed = registrationClosedRaw === "true";
  const individualFeeInr = Number(process.env.INDIVIDUAL_FEE_INR || env.INDIVIDUAL_FEE_INR || 50);
  const teamFeeInr = Number(process.env.TEAM_FEE_INR || env.TEAM_FEE_INR || 200);

  return {
    registrationClosed,
    individualFeeInr: Number.isFinite(individualFeeInr) ? individualFeeInr : 50,
    teamFeeInr: Number.isFinite(teamFeeInr) ? teamFeeInr : 200
  };
}

export async function getEventSettings() {
  const persisted = await EventSettings.findOne({ key: SETTINGS_KEY }).lean();

  if (!persisted) {
    return {
      registrationClosed: Boolean(env.REGISTRATION_CLOSED),
      individualFeeInr: Number(env.INDIVIDUAL_FEE_INR),
      teamFeeInr: Number(env.TEAM_FEE_INR)
    };
  }

  return {
    registrationClosed: Boolean(persisted.registrationClosed),
    individualFeeInr: Number(persisted.individualFeeInr),
    teamFeeInr: Number(persisted.teamFeeInr)
  };
}

export async function updateEventSettings(patch) {
  const settings = await EventSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    {
      $set: {
        key: SETTINGS_KEY,
        ...(typeof patch.registrationClosed === "boolean" ? { registrationClosed: patch.registrationClosed } : {}),
        ...(typeof patch.individualFeeInr === "number" ? { individualFeeInr: patch.individualFeeInr } : {}),
        ...(typeof patch.teamFeeInr === "number" ? { teamFeeInr: patch.teamFeeInr } : {})
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  ).lean();

  return {
    registrationClosed: Boolean(settings.registrationClosed),
    individualFeeInr: Number(settings.individualFeeInr),
    teamFeeInr: Number(settings.teamFeeInr)
  };
}

export async function resetEventSettingsToDefaults() {
  const defaults = getDefaultEventSettings();
  return updateEventSettings(defaults);
}
