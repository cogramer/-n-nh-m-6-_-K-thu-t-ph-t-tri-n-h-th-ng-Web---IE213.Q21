import express from "express";
import * as contactCtrl from "../controllers/ContactCtrl.js";
import authenticateToken, {requireAdmin} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Only admins can view all contacts
router.get("/getAll", authenticateToken, requireAdmin, contactCtrl.getAllContacts);

// Create a new contact
router.post("/create", authenticateToken, contactCtrl.createContact);

// Only admins can mark contacts as read and view details
router.put("/read/:id", authenticateToken, requireAdmin, contactCtrl.readContact);
router.get("/:id", authenticateToken, requireAdmin, contactCtrl.getContactById);

export default router;