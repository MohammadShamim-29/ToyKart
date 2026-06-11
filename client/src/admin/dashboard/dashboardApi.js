import api from "../../api";

const isDashboardPayload = (data) => Boolean(data?.kpis);

function ensureReports(data) {
  if (!data.reports) {
    data.reports = { monthlySales: [], weeklyCategorySales: [], weeklyProductSales: [] };
  }
  return data;
}

/** Map legacy GET /admin/orders/analytics for old API processes still on port 5000. */
function fromLegacyAnalytics(data) {
  if (data?.totalSales == null && data?.todaySales == null) {
    return null;
  }
  const categories = (data.salesByCategory || []).map((c) => ({
    category: c._id || c.category || "Unknown",
    totalAmount: c.totalAmount ?? 0,
    orderCount: c.orderCount ?? 0
  }));

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    kpis: {
      revenueToday: data.todaySales ?? 0,
      revenueYesterday: 0,
      revenueWeek: data.todaySales ?? 0,
      revenuePrevWeek: 0,
      revenueMonth: data.todaySales ?? 0,
      revenuePrevMonth: 0,
      revenueTotal: data.totalSales ?? 0,
      revenueTodayChange: 0,
      revenueWeekChange: 0,
      revenueMonthChange: 0,
      ordersToday: 0,
      ordersTodayChange: 0,
      pendingOrders: 0,
      returnsAwaiting: 0,
      awaitingShipment: 0,
      lowStockCount: 0,
      newCustomersWeek: 0,
      aovMonth: 0,
      sparklines: { revenue: [], orders: [] }
    },
    trends: { daily: [], revenueHeatmap: [] },
    orders: { byStatus: [], awaitingShipment: 0, awaitingShipmentOrders: [], pendingOrders: 0 },
    revenue: { salesByCategory: categories },
    inventory: {
      lowStockProducts: [],
      outOfStockCount: 0,
      inactiveProductsCount: 0,
      topSoldProducts: [],
      topSoldByCategory: [],
      deadInventory: [],
      stockDistribution: [],
      categoryInventory: []
    },
    customers: { total: 0, newThisWeek: 0, repeatCustomers: 0, topBuyers: [], growth: [] },
    returns: { awaiting: 0, pendingReview: 0 },
    payments: { mix: [] },
    refunds: { summary: [] },
    reports: {
      monthlySales: [],
      weeklyCategorySales: [],
      weeklyProductSales: []
    },
    alerts: [],
    recentActivity: [],
    _legacy: true
  };
}

/**
 * Load executive dashboard. Never calls /api/admin/dashboard (often 404 on stale Node processes).
 */
export async function fetchDashboard() {
  const attempts = [
    () => api.get("admin/orders/dashboard"),
    () => api.get("admin/orders/analytics", { params: { executive: "true" } }),
    () => api.get("admin/orders/analytics")
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      const { data } = await attempt();
      if (isDashboardPayload(data)) {
        return ensureReports(data);
      }
      const legacy = fromLegacyAnalytics(data);
      if (legacy) {
        return legacy;
      }
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      if (status === 404 || status === 400) {
        continue;
      }
      throw err;
    }
  }

  const msg =
    lastError?.response?.data?.message ||
    lastError?.message ||
    "Dashboard API unavailable. In your terminal run: kill -9 $(lsof -t -i :5000) then npm run dev";
  const error = new Error(msg);
  error.response = lastError?.response;
  throw error;
}
