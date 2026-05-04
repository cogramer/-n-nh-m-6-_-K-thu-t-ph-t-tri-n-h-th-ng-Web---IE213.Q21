import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/AuthModel.js";
import { verifyToken } from "../utils/jwtUtils.js";

export const changePasswordService = async ({ email, oldPassword, newPassword, resNewPassword }) => {

  if (newPassword !== resNewPassword)
    throw new Error("New passwords do not match");

  if (!newPassword || newPassword.length < 8)
    throw new Error("New password must be at least 8 characters long");

  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  if (!user.password) throw new Error("Password not set for this account. Use social login or reset password.");

  const isMatch = await bcrypt.compare(oldPassword || "", user.password);
  if (!isMatch) throw new Error("Invalid current password");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return "Password updated successfully";
};


export const getProfileService = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");

  return user;
};


export const editProfileService = async (token, data) => {
  if (!token) throw new Error("Token is required");

  const decoded = verifyToken(token, process.env.JWT_SECRET);
  if (!decoded) throw new Error("Invalid token");

  // Only allow safe fields to be edited by users
  const { username, phoneNumber, address } = data;
  const updateData = { username, phoneNumber, address };

  const updatedUser = await User.findByIdAndUpdate(
    decoded.id, 
    { $set: updateData }, // Use $set for explicit updates
    { new: true, runValidators: true }
  ).select("-password -refreshToken"); // Do not return sensitive fields

  return updatedUser;
};


export const updateUserService = async (token, body) => {
  const decoded = verifyToken(token, process.env.JWT_SECRET || "default_secret_key");
  if (!decoded) throw new Error("Invalid token");

  const userId = decoded.id;

  // Consider removing "email" if email changes should be restricted
  const allowedFields = ["username", "phoneNumber", "address"]; 
  const updatedData = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) updatedData[field] = body[field];
  }

  // Block empty update payloads
  if (Object.keys(updatedData).length === 0) {
    throw new Error("No valid fields to update");
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updatedData },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updatedUser) throw new Error("User not found");

  return updatedUser;
};


export const deleteUserService = async (token, idParam) => {

  const decoded = verifyToken(token, process.env.JWT_SECRET || "default_secret_key");
  if (!decoded) throw new Error("Invalid token");

  const userIdFromToken = decoded.id;
  const isAdmin = decoded.isadmin;

  let id = idParam;

  if (id === "me") id = userIdFromToken;

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Invalid user ID");

  if (id === userIdFromToken || isAdmin) {

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) throw new Error("User not found");

    return deletedUser;
  }

  throw new Error("Permission denied");
};


export const logoutService = async (refreshToken) => {
  if (!refreshToken) throw new Error("Refresh token is required");

  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error("Invalid refresh token");

  user.refreshToken = null;
  await user.save();

  return true;
};


export const addToWishlistService = async (userId, productId) => {

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    throw new Error("Invalid userId or productId");
  }

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.wishlist.includes(productId))
    throw new Error("Product already in wishlist");

  user.wishlist.push(productId);
  await user.save();

  return user.wishlist;
};


export const getWishlistService = async (userId) => {

  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new Error("Invalid userId");

  const user = await User.findById(userId).populate("wishlist").exec();
  if (!user) throw new Error("User not found");

  return user.wishlist;
};


export const removeFromWishlistService = async (userId, productId) => {
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new Error("Invalid userId");

  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new Error("Invalid productId");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (!user.wishlist.includes(productId))
    throw new Error("Product not found in wishlist");

  user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
  await user.save();

  return user.wishlist;
};