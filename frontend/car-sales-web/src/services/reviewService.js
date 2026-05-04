import api from "./api"; // Shared axios instance

const ReviewService = {
  /**
   * [USER] Tạo đánh giá mới cho sản phẩm
   * API: POST /api/reviews/create
   * @param {Object} reviewData - { productId, rating, comment }
   * Lưu ý: userId sẽ được BE lấy từ token, nhưng nếu BE yêu cầu truyền 
   * trong body thì bạn thêm vào object này.
   */
  createReview: async (reviewData) => {
    const response = await api.post("/reviews/create", reviewData);
    return response;
  },

  /**
   * [PUBLIC] Lấy danh sách đánh giá của một sản phẩm
   * API: GET /api/reviews/product/:productId
   * @param {string} productId - ID của xe/sản phẩm
   */
  getReviewsByProductId: async (productId) => {
    const response = await api.get(`/reviews/product/${productId}`);
    return response;
  },
};

export default ReviewService;
