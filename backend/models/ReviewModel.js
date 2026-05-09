import mongoose from "mongoose";

/*
  reviewSchema:
  - Mỗi document đại diện cho 1 review
  - Quan hệ:
      1 Product  - N Review
      1 User     - N Review
*/
const reviewSchema = new mongoose.Schema({

    // Reference the Product _id
    // Use ObjectId because MongoDB _id values are ObjectIds
    // ref: Product enables populate()
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

    // Reference the User _id
    // Track which user wrote the review
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Reference the completed order used to verify this purchase
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

    // Only verified purchase reviews are rendered publicly
    verifiedPurchase: { type: Boolean, default: false, index: true },

    // Review rating from 1 to 5
    // min/max validate the rating range
    rating: { type: Number, required: true, min: 1, max: 5 },

    // Optional review comment
    comment: { type: String, trim: true }, 

}, { 
    // Automatically add timestamps
    // Create the review
    // updatedAt -> review update time
    timestamps: true 
});


/*
  Tạo compound unique index:

  Ý nghĩa:
  - Một user chỉ được review 1 product duy nhất 1 lần.
  - Nếu user cố tạo review lần 2 cho cùng product
    → MongoDB sẽ báo lỗi duplicate key.
*/
reviewSchema.index(
    { productId: 1, userId: 1 }, 
    { unique: true }
);


// Export the model for controllers
export default mongoose.model("Review", reviewSchema);
