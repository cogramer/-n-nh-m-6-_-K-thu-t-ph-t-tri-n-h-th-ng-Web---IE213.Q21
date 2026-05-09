import api from "./api"; // Use the shared axios instance with token interceptors

const DashboardService = {
  /**
   * Lấy dữ liệu tổng quan (Tổng user, sản phẩm, doanh thu, tỉ lệ hoàn tất)
   * Tương ứng BE: router.get("/summary", ...)
   */
  getSummary: async () => {
    const response = await api.get("/dashboard/summary");
    return response;
  },

  /**
   * Lấy dữ liệu doanh thu theo thời gian để vẽ biểu đồ Line Chart
   * @param {number} days - Số ngày muốn thống kê (mặc định 7)
   * Tương ứng BE: router.get("/revenue", ...)
   */
  getRevenue: async (days = 7) => {
    const response = await api.get(`/dashboard/revenue`, {
      params: { days }
    });
    return response;
  },

  /**
   * Lấy danh sách 5 sản phẩm bán chạy nhất
   * Tương ứng BE: router.get("/top-products", ...)
   */
  getTopProducts: async () => {
    const response = await api.get("/dashboard/top-products");
    return response;
  },

  /**
   * Thống kê số lượng đơn hàng theo trạng thái (Pie Chart)
   * Tương ứng BE: router.get("/order-status", ...)
   */
  getOrderStatus: async () => {
    const response = await api.get("/dashboard/order-status");
    return response;
  },

  /**
   * Lấy danh sách đơn hàng mới nhất để hiển thị bảng
   * Tương ứng BE: router.get("/recent-orders", ...)
   */
  getRecentOrders: async () => {
    const response = await api.get("/dashboard/recent-orders");
    return response;
  },

  /**
   * Thống kê các chỉ số liên quan đến Blockchain (Deposit, TxHash)
   * Tương ứng BE: router.get("/blockchain", ...)
   */
  getBlockchainStats: async () => {
    const response = await api.get("/dashboard/blockchain");
    return response;
  }
};

export default DashboardService;
