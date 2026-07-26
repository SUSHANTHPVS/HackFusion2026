import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { signToken } from "../services/tokenService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const googleClient = new OAuth2Client();

function buildAuthResponse(user, token) {
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender,
      mobile: user.mobile,
      profilePicture: user.profilePicture
    }
  };
}

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export const register = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email.toLowerCase();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) throw new AppError("Email already exists", 409);

  const user = await User.create({
    ...req.body,
    email: normalizedEmail,
    role: "participant",
    authProvider: "local"
  });
  res.status(201).json({
    message: "User registered",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mobile: user.mobile,
      profilePicture: user.profilePicture
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select("+password");
  if (user?.role === "admin") {
    throw new AppError("Use the dedicated admin login page.", 403);
  }

  if (user?.authProvider === "google") {
    throw new AppError("Use Continue with Google for this account.", 400);
  }

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = signToken(user._id);
  setAuthCookie(res, token);
  res.json(buildAuthResponse(user, token));
});

export const adminLogin = asyncHandler(async (req, res) => {
  if (!env.ADMIN_LOGIN_ID || !env.ADMIN_LOGIN_PASSWORD) {
    throw new AppError("Admin login is not configured on server.", 503);
  }

  const submittedId = String(req.body.adminId || "").trim().toLowerCase();
  const submittedPassword = String(req.body.password || "");
  const configuredId = env.ADMIN_LOGIN_ID.toLowerCase();
  const configuredPassword = env.ADMIN_LOGIN_PASSWORD;

  if (!safeEqual(submittedId, configuredId) || !safeEqual(submittedPassword, configuredPassword)) {
    throw new AppError("Invalid admin credentials", 401);
  }

  let user = await User.findOne({ email: configuredId });

  if (!user) {
    user = await User.create({
      name: env.ADMIN_DISPLAY_NAME,
      email: configuredId,
      password: configuredPassword,
      role: "admin",
      department: "Administration",
      authProvider: "local",
      ieeeMember: false
    });
  } else {
    if (user.role !== "admin") {
      throw new AppError("Configured admin account email belongs to a non-admin user.", 409);
    }

    if (user.name !== env.ADMIN_DISPLAY_NAME) {
      user.name = env.ADMIN_DISPLAY_NAME;
      await user.save();
    }
  }

  const token = signToken(user._id);
  setAuthCookie(res, token);
  res.json(buildAuthResponse(user, token));
});

export const adminLoginHealth = asyncHandler(async (_req, res) => {
  res.json({
    adminLoginConfigured: Boolean(env.ADMIN_LOGIN_ID && env.ADMIN_LOGIN_PASSWORD),
    adminDisplayNameConfigured: Boolean(env.ADMIN_DISPLAY_NAME),
    nodeEnv: env.NODE_ENV
  });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken, clientId } = req.body;
  const audience = env.GOOGLE_CLIENT_ID || clientId;

  if (!audience) {
    throw new AppError("Google auth is not configured on server.", 503);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience
  });
  const payload = ticket.getPayload();

  if (!payload?.email_verified || !payload?.email) {
    throw new AppError("Google account could not be verified.", 401);
  }

  const normalizedEmail = payload.email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      name: payload.name || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      gender: req.body.gender || "male",
      department: req.body.department?.trim() || "General",
      ieeeMember: Boolean(req.body.ieeeMember),
      role: "participant",
      authProvider: "google",
      googleId: payload.sub,
      profilePicture: payload.picture
    });
  } else {
    user.authProvider = "google";
    user.googleId = payload.sub;
    if (req.body.gender && ["male", "female"].includes(req.body.gender)) {
      user.gender = req.body.gender;
    }
    if (!user.profilePicture && payload.picture) {
      user.profilePicture = payload.picture;
    }
    await user.save();
  }

  const token = signToken(user._id);
  setAuthCookie(res, token);

  res.json({
    ...buildAuthResponse(user, token),
    message: "Authenticated with Google"
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
