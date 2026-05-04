import {
    createReviewService,
    getReviewsByProductIdService
} from "../service/ReviewService.js";

// Create a new review
export const createReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user?.id; // Read from the token after authMiddleware runs
        const numericRating = Number(rating);
        
        const review = await createReviewService({ productId, userId, rating: numericRating, comment });
        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// Fetch all reviews for one product
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