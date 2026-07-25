import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { OAuth2Client } from "google-auth-library";
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
