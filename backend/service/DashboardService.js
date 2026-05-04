import User from "../models/AuthModel.js";
import Product from "../models/ProductModel.js";
import Order from "../models/OrderModel.js";

/* ================= SUMMARY ================= */
export const getSummaryService = async () => {
  const [
    totalUsers,
    totalProducts,
    orderStats,
    todayStats,
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),

    // ===== ORDER AGGREGATE =====
    Order.aggregate([
      {
        $match: { status: { $ne: "cancelled" } },
      },
      {
        $group: {
          _id: null,

          totalOrders: { $sum: 1 },

          // Completed revenue
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$status", "completed"] },
                "$totalAmount",
                0,
              ],
            },
          },

          // Completed orders
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },

          // Processing orders
          processingOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "processing"] }, 1, 0],
            },
          },

          // Orders waiting for deposit
          pendingOrders: {
            $sum: {
              $cond: [
                { $in: ["$status", ["pending_deposit", "pending_payment", "payment_paid"]] },
                1,
                0,
              ],
            },
          },

          // Total order value
          totalOrderValue: { $sum: "$totalAmount" },

          // Total paid amount
          totalPaid: { $sum: "$paidAmount" },
        },
      },
    ]),

    // ===== TODAY STATS =====
    Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      },
      {
        $group: {
          _id: null,
          todayOrders: { $sum: 1 },
          todayRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$status", "completed"] },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const stats = orderStats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    completedOrders: 0,
    processingOrders: 0,
    pendingOrders: 0,
    totalOrderValue: 0,
    totalPaid: 0,
  };

  const today = todayStats[0] || {
    todayOrders: 0,
    todayRevenue: 0,
  };

  return {
    totalUsers,
    totalProducts,

    // ===== ORDERS =====
    totalOrders: stats.totalOrders,
    completedOrders: stats.completedOrders,
    processingOrders: stats.processingOrders,
    pendingOrders: stats.pendingOrders,

    // ===== MONEY =====
    totalRevenue: stats.totalRevenue,
    totalOrderValue: stats.totalOrderValue,
    totalPaid: stats.totalPaid,

    // ===== TODAY =====
    todayOrders: today.todayOrders,
    todayRevenue: today.todayRevenue,

    // ===== CALCULATED =====
    completionRate:
      stats.totalOrders > 0
        ? (stats.completedOrders / stats.totalOrders) * 100
        : 0,

    paymentRate:
      stats.totalOrderValue > 0
        ? (stats.totalPaid / stats.totalOrderValue) * 100
        : 0,
  };
};

/* ================= REVENUE ================= */
export const getRevenueService = async (days = 7) => {
  const safeDays = Math.min(Math.max(Number(days) || 7, 1), 90);
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - safeDays + 1);

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const rawData = await Order.aggregate([
    {
      $match: {
        status: { $ne: "cancelled" },
        createdAt: {
          $gte: startDate,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: "+07:00",
          },
        },
        revenue: { $sum: { $ifNull: ["$paidAmount", 0] } },
        completedRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$status", "completed"] },
              { $ifNull: ["$totalAmount", 0] },
              0,
            ],
          },
        },
        orderValue: { $sum: { $ifNull: ["$totalAmount", 0] } },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dataByDate = new Map(rawData.map((item) => [item._id, item]));

  return Array.from({ length: safeDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const key = formatDateKey(date);
    const item = dataByDate.get(key);

    return {
      _id: key,
      date: key,
      label: date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      revenue: item?.revenue || 0,
      completedRevenue: item?.completedRevenue || 0,
      orderValue: item?.orderValue || 0,
      orders: item?.orders || 0,
    };
  });
};

/* ================= TOP PRODUCTS ================= */
export const getTopProductsService = async () => {
  return await Order.aggregate([
    {
      $match: {
        status: { $in: ["deposit_paid", "payment_paid", "processing", "completed"] }
      }
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        name: { $first: "$items.name" },
        sold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { sold: -1 } },
    { $limit: 5 },
  ]);
};

/* ================= ORDER STATUS ================= */
export const getOrderStatusService = async () => {
  return await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

/* ================= RECENT ORDERS ================= */
export const getRecentOrdersService = async () => {
  return await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("userId", "username email")
    .lean();
};


/* ================= BLOCKCHAIN ================= */
export const getBlockchainStatsService = async () => {
  const data = await Order.aggregate([
    {
      $match: {
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: null,

        // ===== BASIC =====
        totalOrders: { $sum: 1 },

        totalDeposit: {
          $sum: {
            $cond: [
              { $eq: ["$depositStatus", "paid"] },
              "$depositAmount",
              0,
            ],
          },
        },

        totalPaid: { $sum: "$paidAmount" },

        paidOrders: {
          $sum: {
            $cond: [{ $eq: ["$depositStatus", "paid"] }, 1, 0],
          },
        },

        // ===== ADVANCED =====

        // Completed orders
        completedOrders: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },

        // Processing orders
        processingOrders: {
          $sum: {
            $cond: [{ $eq: ["$status", "processing"] }, 1, 0],
          },
        },

        // Total order value
        totalOrderValue: { $sum: "$totalAmount" },

        // Total remaining amount
        remainingAmount: {
          $sum: {
            $subtract: ["$totalAmount", "$paidAmount"],
          },
        },

        // Orders with blockchain deposit transactions
        blockchainOrders: {
          $sum: {
            $cond: [
              { $ne: ["$depositTxHash", ""] },
              1,
              0,
            ],
          },
        },

        // Total deposit amount from real blockchain transactions
        blockchainDeposit: {
          $sum: {
            $cond: [
              { $ne: ["$depositTxHash", ""] },
              "$depositAmount",
              0,
            ],
          },
        },
      },
    },
  ]);

  const result = data[0] || {
    totalOrders: 0,
    totalDeposit: 0,
    totalPaid: 0,
    paidOrders: 0,
    completedOrders: 0,
    processingOrders: 0,
    totalOrderValue: 0,
    remainingAmount: 0,
    blockchainOrders: 0,
    blockchainDeposit: 0,
  };

  // ===== CALCULATED FIELDS =====

  return {
    ...result,

    // % orders with deposit
    depositRate:
      result.totalOrders > 0
        ? (result.paidOrders / result.totalOrders) * 100
        : 0,

    // % completed
    completionRate:
      result.totalOrders > 0
        ? (result.completedOrders / result.totalOrders) * 100
        : 0,

    // % paid
    paymentRate:
      result.totalOrderValue > 0
        ? (result.totalPaid / result.totalOrderValue) * 100
        : 0,
  };
};
