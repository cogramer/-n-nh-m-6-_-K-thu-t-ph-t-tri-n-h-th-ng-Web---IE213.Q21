import Review from "../models/ReviewModel.js";
import Product from "../models/ProductModel.js";

// Create a new review and update the product rating
export const createReviewService = async (data) => {
    // destructure input once
    const { productId, userId, rating, comment } = data;

    // Validate input data
    if (!productId || !userId || rating === undefined) {
        throw new Error("productId, userId và rating là bắt buộc");
    }

    // Ensure rating is numeric
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        throw new Error("Rating phải là số từ 1 đến 5");
    }

    // Check that the product exists
    const product = await Product.findById(productId);
    if (!product) {
        throw new Error("Không tìm thấy sản phẩm");
    }

    // Check whether the user has already reviewed
    const existingReview = await Review.findOne({
        productId,
        userId
    });

    if (existingReview) {
        throw new Error("User đã đánh giá sản phẩm này");
    }

    // Create the review
    const newReview = await Review.create({
        productId,
        userId,
        rating: numericRating,
        comment,
    });

    // Calculate the new rating in O(1)
    const newReviewCount = product.reviewCount + 1;
    const newAverageRating = (product.averageRating * product.reviewCount + numericRating) / newReviewCount;

    // 5. Update product
    product.reviewCount = newReviewCount;
    product.averageRating = newAverageRating;
    await product.save();

    return newReview;
};

// Fetch all reviews for one product
export const getReviewsByProductIdService = async (productId) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new Error("Không tìm thấy sản phẩm");
    }

    return await Review.find({ productId }).populate('userId', 'username');
};



