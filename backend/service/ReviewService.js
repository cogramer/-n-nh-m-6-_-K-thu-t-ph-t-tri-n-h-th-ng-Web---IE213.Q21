import Review from "../models/ReviewModel.js";
import Order from "../models/OrderModel.js";
import Product from "../models/ProductModel.js";

const syncProductReviewStats = async (product) => {
    const [stats] = await Review.aggregate([
        { $match: { productId: product._id, verifiedPurchase: true } },
        {
            $group: {
                _id: "$productId",
                count: { $sum: 1 },
                average: { $avg: "$rating" },
            },
        },
    ]);

    product.reviewCount = stats?.count || 0;
    product.averageRating = stats?.average || 0;
    await product.save();
};

const findCompletedPurchase = async ({ productId, userId, orderId }) => {
    const query = {
        userId,
        status: "completed",
        "items.productId": productId,
    };

    if (orderId) {
        query._id = orderId;
    }

    return await Order.findOne(query)
        .select("_id")
        .sort({ updatedAt: -1 })
        .lean();
};

// Create or update a verified purchase review and sync product rating.
export const createReviewService = async (data) => {
    const { productId, userId, rating, comment, orderId } = data;

    if (!productId || !userId || rating === undefined) {
        throw new Error("productId, userId and rating are required");
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        throw new Error("Rating must be a number from 1 to 5");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new Error("Product not found");
    }

    const completedOrder = await findCompletedPurchase({
        productId,
        userId,
        orderId,
    });

    if (!completedOrder) {
        throw new Error("Only customers who completed a purchase for this vehicle can leave a review");
    }

    const normalizedComment = comment?.trim?.() || "";

    const existingReview = await Review.findOne({
        productId,
        userId,
    });

    if (existingReview) {
        existingReview.rating = numericRating;
        existingReview.comment = normalizedComment;
        existingReview.orderId = completedOrder._id;
        existingReview.verifiedPurchase = true;
        await existingReview.save();
        await syncProductReviewStats(product);
        return existingReview;
    }

    const newReview = await Review.create({
        productId,
        userId,
        orderId: completedOrder._id,
        verifiedPurchase: true,
        rating: numericRating,
        comment: normalizedComment,
    });

    await syncProductReviewStats(product);

    return newReview;
};

// Fetch verified purchase reviews for one product.
export const getReviewsByProductIdService = async (productId) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new Error("Product not found");
    }

    await syncProductReviewStats(product);

    return await Review.find({ productId, verifiedPurchase: true }).populate("userId", "username");
};

export const getMyReviewByProductIdService = async (productId, userId) => {
    if (!productId || !userId) {
        throw new Error("productId and userId are required");
    }

    return await Review.findOne({
        productId,
        userId,
        verifiedPurchase: true,
    });
};
