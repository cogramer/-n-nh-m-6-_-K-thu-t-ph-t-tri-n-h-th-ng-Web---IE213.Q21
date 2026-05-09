import {
    createReviewService,
    getReviewsByProductIdService,
    getMyReviewByProductIdService
} from "../service/ReviewService.js";

// Create or update a verified purchase review
export const createReview = async (req, res) => {
    try {
        const { productId, rating, comment, orderId } = req.body;
        const userId = req.user?.id; // Read from the token after authMiddleware runs
        const numericRating = Number(rating);
        
        const review = await createReviewService({ productId, userId, rating: numericRating, comment, orderId });
        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// Fetch verified purchase reviews for one product
export const getReviewsByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await getReviewsByProductIdService(productId);
        res.status(200).json(reviews);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getMyReviewByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user?.id;
        const review = await getMyReviewByProductIdService(productId, userId);
        res.status(200).json(review);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
