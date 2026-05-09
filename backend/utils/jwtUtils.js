import jwt from "jsonwebtoken";
import { getRequiredSecret } from "../config/secrets.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, isadmin: user.isadmin },
    getRequiredSecret("JWT_SECRET"),
    { expiresIn: "1h" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, isadmin: user.isadmin },
    getRequiredSecret("JWT_REFRESH_SECRET"),
    { expiresIn: "7d" }
  );
};

export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
};
