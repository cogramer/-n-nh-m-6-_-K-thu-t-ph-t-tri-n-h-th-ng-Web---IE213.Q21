import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";

import {
  changePassword,
  getProfile,
  editProfile,
  deleteUser,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  logout,
} from "../controllers/AccountCtrl.js";

const router = express.Router();

// Changing password requires authentication
router.post("/changePassword", authenticateToken, changePassword);
router.get('/getProfile', authenticateToken, getProfile);
router.put('/editProfile', authenticateToken, editProfile);

// Delete the current account; keep this route before /:id
router.delete("/me", authenticateToken, (req, res) => {
  req.params.id = "me";
  return deleteUser(req, res);
});

// Delete a user by id as admin or the current user
router.delete("/:id", authenticateToken, deleteUser);

router.post("/logout", logout);

// wishlist
router.post("/wishlist/add", authenticateToken, addToWishlist);
router.get("/wishlist", authenticateToken, getWishlist);
router.delete("/wishlist/remove", authenticateToken, removeFromWishlist);

export default router;