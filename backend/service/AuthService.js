import User from "../models/AuthModel.js";
import Otp from "../models/OTPModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendMail, { describeMailerError } from "../utils/mailer.js";
import { getRequiredSecret } from "../config/secrets.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../utils/jwtUtils.js";

const OTP_TTL_MS = 5 * 60 * 1000;

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const normalizeUsername = (username) =>
  typeof username === "string" ? username.trim() : "";

const createOtpForEmail = async (email) => {
  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);

  await Otp.deleteMany({ email });
  await Otp.create({
    email,
    otp: hashedOtp,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  return otp;
};

const buildOtpEmail = ({ title, intro, otp }) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
    <h2 style="margin: 0 0 12px;">${title}</h2>
    <p style="margin: 0 0 16px;">${intro}</p>
    <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 14px 18px; background: #f3f4f6; border-radius: 10px; display: inline-block;">
      ${otp}
    </div>
    <p style="margin: 16px 0 0; color: #6b7280;">This code expires in 5 minutes.</p>
  </div>
`;

/*
REGISTER
*/
export const registerService = async ({
  username,
  email,
  password,
  resPassword,
}) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername) throw new Error("Username is required");
  if (!normalizedEmail) throw new Error("Email is required");
  if (!password || typeof password !== "string")
    throw new Error("Password is invalid");
  if (!resPassword || typeof resPassword !== "string")
    throw new Error("Confirm password is invalid");
  if (password !== resPassword) throw new Error("Passwords do not match");

  const existingByEmail = await User.findOne({ email: normalizedEmail });
  const existingByUsername = await User.findOne({ username: normalizedUsername });

  if (existingByUsername && existingByUsername.email !== normalizedEmail) {
    throw new Error("Username or Email already exists");
  }

  if (existingByEmail?.isVerified) {
    throw new Error("Username or Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (existingByEmail) {
    existingByEmail.username = normalizedUsername;
    existingByEmail.password = hashedPassword;
    existingByEmail.isVerified = true;
    await existingByEmail.save();
  } else {
    await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: true,
    });
  }

  await Otp.deleteMany({ email: normalizedEmail });

  return true;
};

/*
VERIFY OTP
*/
export const verifyOtpService = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) throw new Error("Email is required");
  if (!otp || typeof otp !== "string") throw new Error("OTP is required");

  const otpRecord = await Otp.findOne({ email: normalizedEmail }).sort({
    createdAt: -1,
  });

  if (!otpRecord) throw new Error("OTP does not exist or has expired");

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new Error("OTP has expired");
  }

  const isMatch = await bcrypt.compare(otp.trim(), otpRecord.otp);
  if (!isMatch) throw new Error("Invalid OTP");

  await User.updateOne({ email: normalizedEmail }, { isVerified: true });
  await Otp.deleteOne({ _id: otpRecord._id });

  return true;
};

/*
LOGIN
*/
export const loginService = async (email, password) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) throw new Error("Invalid email or password");
  if (!user.isVerified) throw new Error("Email has not been verified yet");
  if (!user.password) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    token,
    refreshToken,
    user,
  };
};

/*
GOOGLE LOGIN
*/
export const googleAuthService = async (googleId) => {
  const user = await User.findOne({ googleId });

  if (!user) throw new Error("User has not registered with Google");

  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    token,
    refreshToken,
    user,
  };
};

/*
REFRESH TOKEN
*/
export const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) throw new Error("Refresh token is invalid");

  const decoded = verifyToken(refreshToken, getRequiredSecret("JWT_REFRESH_SECRET"));
  if (!decoded) throw new Error("Refresh token is invalid or expired");

  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken)
    throw new Error("Refresh token is invalid");

  const newToken = jwt.sign(
    {
      id: decoded.id,
      username: decoded.username,
      isadmin: decoded.isadmin,
    },
    getRequiredSecret("JWT_SECRET"),
    { expiresIn: "1h" }
  );

  return newToken;
};

/*
FORGOT PASSWORD
*/
export const forgotPasswordService = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("Email is required");

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new Error("Email does not exist in the system");

  const otp = await createOtpForEmail(normalizedEmail);

  try {
    await sendMail(
      normalizedEmail,
      "Saigon Speed - Reset password OTP",
      buildOtpEmail({
        title: "Reset your Saigon Speed password",
        intro: "Use this OTP to set a new password for your account.",
        otp,
      })
    );
  } catch (error) {
    await Otp.deleteMany({ email: normalizedEmail });
    throw new Error(describeMailerError(error));
  }

  return true;
};

/*
RESET PASSWORD
*/
export const resetPasswordService = async ({ email, otp, newPassword }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) throw new Error("Email is required");
  if (!otp || typeof otp !== "string") throw new Error("OTP is required");
  if (!newPassword || typeof newPassword !== "string")
    throw new Error("Password is invalid");

  const otpRecord = await Otp.findOne({ email: normalizedEmail }).sort({
    createdAt: -1,
  });

  if (!otpRecord) throw new Error("OTP is invalid or has expired");

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new Error("OTP has expired");
  }

  const isMatch = await bcrypt.compare(otp.trim(), otpRecord.otp);
  if (!isMatch) throw new Error("Incorrect OTP");

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new Error("Email does not exist in the system");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.updateOne(
    { email: normalizedEmail },
    { password: hashedPassword, isVerified: true }
  );
  await Otp.deleteOne({ _id: otpRecord._id });

  return true;
};
