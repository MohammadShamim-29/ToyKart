import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import ReturnRequest from "../models/ReturnRequest.js";
import Refund from "../models/Refund.js";
import { awaitingShipmentFilter, humanOrderNumber } from "../utils/orderLifecycle.js";
import { computeSoldProductStats } from "../utils/soldProductStats.js";

const LOW_STOCK_THRESHOLD = 5;
const TREND_DAYS = 30;
const SPARKLINE_DAYS = 7;

const baseOrderMatch = { adminDeletedAt: { $exists: false } };
const revenueMatch = { ...baseOrderMatch, isPaid: true, status: { $ne: "cancelled" } };

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysAgo = (n, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
};

const sumRevenue = async (extraMatch = {}) => {
  const rows = await Order.aggregate([
    { $match: { ...revenueMatch, ...extraMatch } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
  ]);
  return rows[0]?.total || 0;
};

const countOrders = async (match = {}) =>
  Order.countDocuments({ ...baseOrderMatch, ...match });

const dailyTrend = async (days = TREND_DAYS) => {
  const since = daysAgo(days - 1, startOfDay());
  const paid = await Order.aggregate([
    { $match: { ...revenueMatch, paidAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
        revenue: { $sum: "$totalPrice" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const allOrders = await Order.aggregate([
    { $match: { ...baseOrderMatch, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const mapPaid = Object.fromEntries(paid.map((r) => [r._id, r]));
  const mapAll = Object.fromEntries(allOrders.map((r) => [r._id, r]));
  const series = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i, startOfDay());
    const key = d.toISOString().slice(0, 10);
    const rev = mapPaid[key]?.revenue || 0;
    const paidOrders = mapPaid[key]?.orders || 0;
    const totalOrders = mapAll[key]?.orders || 0;
    series.push({
      date: key,
      revenue: rev,
      paidOrders,
      orders: totalOrders,
      aov: paidOrders > 0 ? Math.round(rev / paidOrders) : 0
    });
  }
  return series;
};

const pctChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const sparklineFromTrend = (trend, key, days = SPARKLINE_DAYS) =>
  trend.slice(-days).map((d) => d[key] ?? 0);

export const getAdminDashboard = async (req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = daysAgo(1, todayStart);
  const weekStart = daysAgo(6, todayStart);
  const prevWeekStart = daysAgo(13, todayStart);
  const prevWeekEnd = daysAgo(7, todayStart);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const returnAwaitingStatuses = ["PENDING", "UNDER_REVIEW", "NEED_MORE_INFO", "CUSTOMER_RESPONDED", "REFUND_APPROVED"];
  const returnReviewStatuses = ["PENDING", "UNDER_REVIEW", "NEED_MORE_INFO", "CUSTOMER_RESPONDED"];

  const [
    revenueToday,
    revenueYesterday,
    revenueWeek,
    revenuePrevWeek,
    revenueMonth,
    revenuePrevMonth,
    revenueTotal,
    ordersToday,
    ordersYesterday,
    pendingOrders,
    returnsAwaiting,
    trend30,
    ordersByStatus,
    paymentMix,
    salesByCategory,
    awaitingShipment,
    awaitingShipmentOrders,
    refundsPendingApproval,
    returnsPendingReview,
    codUnpaidRisk,
    delayedDeliveries,
    lowStockProducts,
    outOfStockCount,
    inactiveProductsCount,
    deadInventory,
    totalCustomers,
    newUsersWeek,
    repeatCustomers,
    topBuyers,
    customerGrowth,
    recentOrders,
    recentReturns,
    recentRefunds,
    recentRegistrations,
    categoryInventory,
    stockDistribution,
    refundsSummary
  ] = await Promise.all([
    sumRevenue({ paidAt: { $gte: todayStart } }),
    sumRevenue({ paidAt: { $gte: yesterdayStart, $lt: todayStart } }),
    sumRevenue({ paidAt: { $gte: weekStart } }),
    sumRevenue({ paidAt: { $gte: prevWeekStart, $lt: prevWeekEnd } }),
    sumRevenue({ paidAt: { $gte: monthStart } }),
    sumRevenue({ paidAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
    sumRevenue(),
    countOrders({ createdAt: { $gte: todayStart } }),
    countOrders({ createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
    countOrders({ status: "pending" }),
    ReturnRequest.countDocuments({ status: { $in: returnAwaitingStatuses } }),
    dailyTrend(TREND_DAYS),
    Order.aggregate([
      { $match: baseOrderMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Order.aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          amount: { $sum: "$totalPrice" }
        }
      },
      { $sort: { amount: -1 } }
    ]),
    Order.aggregate([
      { $match: revenueMatch },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $lookup: {
          from: "categories",
          localField: "productInfo.category",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      { $unwind: "$categoryInfo" },
      {
        $group: {
          _id: "$categoryInfo.name",
          totalAmount: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 12 }
    ]),
    countOrders(awaitingShipmentFilter()),
    Order.find({ ...baseOrderMatch, ...awaitingShipmentFilter() })
      .select("_id status paymentMethod isPaid totalPrice createdAt orderItems.name orderItems.qty")
      .sort({ createdAt: 1 })
      .limit(30)
      .lean(),
    Order.countDocuments({
      ...baseOrderMatch,
      status: "cancelled",
      refundStatus: { $in: ["none", "pending"] },
      cancellationApprovedAt: { $exists: false }
    }),
    ReturnRequest.countDocuments({ status: { $in: returnReviewStatuses } }),
    countOrders({
      paymentMethod: "CashOnDelivery",
      isPaid: false,
      status: { $nin: ["cancelled", "delivered", "refunded"] },
      createdAt: { $lte: daysAgo(3) }
    }),
    countOrders({
      status: "shipped",
      isDelivered: false,
      "fulfillment.shippedAt": { $lte: daysAgo(7) }
    }),
    Product.find({
      status: "active",
      countInStock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD }
    })
      .sort({ countInStock: 1 })
      .limit(10)
      .select("name sku countInStock price category")
      .populate("category", "name")
      .lean(),
    Product.countDocuments({ status: "active", countInStock: 0 }),
    Product.countDocuments({ status: "inactive" }),
    Product.find({
      status: "active",
      soldCount: 0,
      countInStock: { $gt: 0 },
      createdAt: { $lte: daysAgo(60) }
    })
      .sort({ countInStock: -1 })
      .limit(6)
      .select("name sku countInStock createdAt")
      .lean(),
    User.countDocuments({ isAdmin: false }),
    User.countDocuments({ isAdmin: false, createdAt: { $gte: weekStart } }),
    Order.aggregate([
      { $match: revenueMatch },
      { $group: { _id: "$user", orders: { $sum: 1 } } },
      { $match: { orders: { $gt: 1 } } },
      { $count: "count" }
    ]).then((r) => r[0]?.count || 0),
    Order.aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          email: "$user.email",
          totalSpent: 1,
          orderCount: 1
        }
      }
    ]),
    User.aggregate([
      { $match: { isAdmin: false, createdAt: { $gte: daysAgo(TREND_DAYS - 1, startOfDay()) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Order.find(baseOrderMatch)
      .sort({ createdAt: -1 })
      .limit(8)
      .select("_id totalPrice status isPaid paymentMethod createdAt shippingAddress.firstName user")
      .populate("user", "name email")
      .lean(),
    ReturnRequest.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("_id status reason createdAt order")
      .lean(),
    Refund.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("_id status refundAmount sourceType createdAt orderId")
      .lean(),
    User.find({ isAdmin: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt")
      .lean(),
    Product.aggregate([
      { $match: { status: "active" } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "cat"
        }
      },
      { $unwind: "$cat" },
      {
        $group: {
          _id: "$cat.name",
          units: { $sum: "$countInStock" },
          products: { $sum: 1 }
        }
      },
      { $sort: { units: -1 } },
      { $limit: 8 }
    ]),
    Product.aggregate([
      { $match: { status: "active" } },
      {
        $bucket: {
          groupBy: "$countInStock",
          boundaries: [0, 1, 6, 21, 101, 10000],
          default: "10000+",
          output: { count: { $sum: 1 } }
        }
      }
    ]),
    Refund.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$refundAmount" }
        }
      }
    ])
  ]);

  const trendSpark = trend30;
  const paidOrdersMonth = await countOrders({
    ...revenueMatch,
    paidAt: { $gte: monthStart }
  });
  const aovMonth =
    paidOrdersMonth > 0 ? Math.round(revenueMonth / paidOrdersMonth) : 0;

  const { overallTop: topSoldProducts, topSoldByCategory } = await computeSoldProductStats({
    overallLimit: 10
  });

  const heatmap = await Order.aggregate([
    { $match: { ...revenueMatch, paidAt: { $gte: daysAgo(27, todayStart) } } },
    {
      $group: {
        _id: { $dayOfWeek: "$paidAt" },
        revenue: { $sum: "$totalPrice" }
      }
    }
  ]);
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const revenueHeatmap = weekdayLabels.map((label, idx) => {
    const mongoDow = idx === 0 ? 1 : idx + 1;
    const row = heatmap.find((h) => h._id === mongoDow);
    return { day: label, revenue: row?.revenue || 0 };
  });

  const alerts = [
    {
      id: "awaiting-shipment",
      label: "Orders awaiting shipment",
      count: awaitingShipment,
      severity: awaitingShipment > 10 ? "high" : awaitingShipment > 0 ? "medium" : "low",
      link: "/admin/orders",
      cta: "View orders"
    },
    {
      id: "returns-review",
      label: "Returns pending review",
      count: returnsPendingReview,
      severity: returnsPendingReview > 5 ? "high" : returnsPendingReview > 0 ? "medium" : "low",
      link: "/admin/returns",
      cta: "Review returns"
    },
    {
      id: "refund-approval",
      label: "Cancellations need refund approval",
      count: refundsPendingApproval,
      severity: refundsPendingApproval > 0 ? "high" : "low",
      link: "/admin/cancelled-orders",
      cta: "Open cancelled"
    },
    {
      id: "cod-risk",
      label: "Stale unpaid COD orders",
      count: codUnpaidRisk,
      severity: codUnpaidRisk > 3 ? "medium" : "low",
      link: "/admin/orders",
      cta: "Review COD"
    },
    {
      id: "delayed-delivery",
      label: "Delayed deliveries",
      count: delayedDeliveries,
      severity: delayedDeliveries > 0 ? "medium" : "low",
      link: "/admin/orders",
      cta: "Track"
    },
    {
      id: "low-stock",
      label: "Low stock SKUs",
      count: lowStockProducts.length,
      severity: lowStockProducts.length > 5 ? "high" : lowStockProducts.length > 0 ? "medium" : "low",
      link: "/admin/products",
      cta: "Restock"
    }
  ].filter((a) => a.count > 0);

  const recentActivity = [
    ...recentOrders.map((o) => ({
      type: "order",
      id: String(o._id),
      title: `Order ${humanOrderNumber(o._id)}`,
      subtitle: o.user?.name || o.shippingAddress?.firstName || "Customer",
      amount: o.totalPrice,
      status: o.status,
      isPaid: o.isPaid,
      at: o.createdAt
    })),
    ...recentReturns.map((r) => ({
      type: "return",
      id: String(r._id),
      title: "Return request",
      subtitle: r.reason || r.status,
      status: r.status,
      at: r.createdAt
    })),
    ...recentRefunds.map((r) => ({
      type: "refund",
      id: String(r._id),
      title: `${r.sourceType || "Refund"} refund`,
      subtitle: r.status,
      amount: r.refundAmount,
      status: r.status,
      at: r.createdAt
    })),
    ...recentRegistrations.map((u) => ({
      type: "registration",
      id: String(u._id),
      title: u.name,
      subtitle: u.email,
      at: u.createdAt
    }))
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 12);

  res.json({
    success: true,
    generatedAt: now.toISOString(),
    kpis: {
      revenueToday,
      revenueYesterday,
      revenueWeek,
      revenuePrevWeek,
      revenueMonth,
      revenuePrevMonth,
      revenueTotal,
      revenueTodayChange: pctChange(revenueToday, revenueYesterday),
      revenueWeekChange: pctChange(revenueWeek, revenuePrevWeek),
      revenueMonthChange: pctChange(revenueMonth, revenuePrevMonth),
      ordersToday,
      ordersTodayChange: pctChange(ordersToday, ordersYesterday),
      pendingOrders,
      returnsAwaiting,
      awaitingShipment,
      lowStockCount: lowStockProducts.length,
      newCustomersWeek: newUsersWeek,
      aovMonth,
      sparklines: {
        revenue: sparklineFromTrend(trendSpark, "revenue"),
        orders: sparklineFromTrend(trendSpark, "orders")
      }
    },
    trends: {
      daily: trend30,
      revenueHeatmap
    },
    orders: {
      byStatus: ordersByStatus.map((r) => ({ status: r._id, count: r.count })),
      awaitingShipment,
      awaitingShipmentOrders: awaitingShipmentOrders.map((o) => ({
        id: String(o._id),
        orderNumber: humanOrderNumber(o._id),
        status: o.status,
        paymentMethod: o.paymentMethod,
        isPaid: Boolean(o.isPaid),
        totalPrice: o.totalPrice,
        products: (o.orderItems || []).map((item) => ({
          name: item.name,
          qty: item.qty
        }))
      })),
      pendingOrders
    },
    revenue: {
      salesByCategory: salesByCategory.map((c) => ({
        category: c._id,
        totalAmount: c.totalAmount,
        orderCount: c.orderCount
      }))
    },
    inventory: {
      lowStockProducts: lowStockProducts.map((p) => ({
        id: String(p._id),
        name: p.name,
        sku: p.sku,
        countInStock: p.countInStock,
        price: p.price,
        category: p.category?.name || ""
      })),
      outOfStockCount,
      inactiveProductsCount,
      topSoldProducts,
      topSoldByCategory,
      deadInventory: deadInventory.map((p) => ({
        id: String(p._id),
        name: p.name,
        sku: p.sku,
        countInStock: p.countInStock
      })),
      stockDistribution: stockDistribution.map((b) => ({
        range: String(b._id),
        count: b.count
      })),
      categoryInventory: categoryInventory.map((c) => ({
        category: c._id,
        units: c.units,
        products: c.products
      }))
    },
    customers: {
      total: totalCustomers,
      newThisWeek: newUsersWeek,
      repeatCustomers,
      topBuyers,
      growth: customerGrowth.map((g) => ({ date: g._id, count: g.count }))
    },
    returns: {
      awaiting: returnsAwaiting,
      pendingReview: returnsPendingReview
    },
    payments: {
      mix: paymentMix.map((p) => ({
        method: p._id,
        count: p.count,
        amount: p.amount
      }))
    },
    refunds: {
      summary: refundsSummary.map((r) => ({
        status: r._id,
        count: r.count,
        amount: r.amount
      }))
    },
    alerts,
    recentActivity
  });
};
