import express from "express";
import authenticateToken from "../middlewares/authMiddleware.js";

import * as reviewCtrl from "../controllers/ReviewCtrl.js";

const router = express.Router();

// Only authenticated users can create reviews
router.post("/create", authenticateToken, reviewCtrl.createReview); // POST /api/reviews/create
router.get("/my/:productId", authenticateToken, reviewCtrl.getMyReviewByProductId); // GET /api/reviews/my/:productId
router.get("/product/:productId", reviewCtrl.getReviewsByProductId); // GET /api/reviews/product/:productId

export default router;
