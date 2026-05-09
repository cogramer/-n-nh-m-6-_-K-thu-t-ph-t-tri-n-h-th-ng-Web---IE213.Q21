import express from "express";

// Import controllers that handle dashboard logic
import {
  getSummary,         
  getRevenue,         
  getTopProducts,      
  getOrderStatus,      
  getRecentOrders,     
  getBlockchainStats,
} from "../controllers/DashboardCtrl.js";
import authenticateToken, {requireAdmin} from "../middlewares/authMiddleware.js";

// Initialize the Express router
const router = express.Router();

/* ================= DASHBOARD ROUTES ================= */

/**
 * @route   GET /api/dashboard/summary
 * @desc    Lấy dữ liệu tổng quan cho dashboard
 * @use     Hiển thị các card:
 *          - Tổng user
 *          - Tổng sản phẩm
 *          - Tổng đơn hàng
 *          - Tổng doanh thu
 */
router.get("/summary", authenticateToken, requireAdmin, getSummary);

/**
 * @route   GET /api/dashboard/revenue?days=7
 * @desc    Lấy doanh thu theo số ngày (mặc định 7 ngày)
 * @use     Dùng để vẽ biểu đồ (line chart)
 */
router.get("/revenue", authenticateToken, requireAdmin, getRevenue);

/**
 * @route   GET /api/dashboard/top-products
 * @desc    Lấy danh sách sản phẩm bán chạy nhất
 * @use     Hiển thị bảng top sản phẩm
 */
router.get("/top-products", authenticateToken, requireAdmin, getTopProducts);

/**
 * @route   GET /api/dashboard/order-status
 * @desc    Thống kê số lượng đơn theo trạng thái
 * @use     Pie chart / bar chart:
 *          - pending
 *          - completed
 *          - cancelled
 */
router.get("/order-status", authenticateToken, requireAdmin, getOrderStatus);

/**
 * @route   GET /api/dashboard/recent-orders
 * @desc    Lấy danh sách đơn hàng mới nhất
 * @use     Hiển thị bảng đơn hàng gần đây
 */
router.get("/recent-orders", authenticateToken, requireAdmin, getRecentOrders);

/**
 * @route   GET /api/dashboard/blockchain
 * @desc    Thống kê thanh toán blockchain
 * @use     Hiển thị:
 *          - Tổng tiền đặt cọc
 *          - Tổng tiền đã thanh toán
 *          - Số đơn đã trả cọc
 */
router.get("/blockchain", authenticateToken, requireAdmin, getBlockchainStats);

// Export the router for app.js/server.js
export default router;