import api from "./api"; // Shared axios instance

const ReviewService = {
  /**
   * [USER] Tạo hoặc cập nhật đánh giá cho sản phẩm đã mua
   * API: POST /api/reviews/create
   * @param {Object} reviewData - { productId, orderId?, rating, comment }
   * userId được backend lấy từ token.
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

  /**
   * [USER] Lấy review hiện tại của user cho một sản phẩm
   * API: GET /api/reviews/my/:productId
   */
  getMyReviewByProductId: async (productId) => {
    const response = await api.get(`/reviews/my/${productId}`);
    return response;
  },
};

export default ReviewService;
