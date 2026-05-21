import { DashGrid, DashGridItem } from "./DashGrid";
import {
  Banknote,
  Calendar,
  CalendarDays,
  CalendarRange,
  ShoppingCart,
  Clock,
  RotateCcw,
  Package,
  TrendingUp
} from "lucide-react";
import { KPICard } from "./KPICard";
import { dash } from "./theme";

export const KPIGrid = ({ kpis }) => {
  const spark = kpis?.sparklines?.revenue || [];
  const sparkOrders = kpis?.sparklines?.orders || [];

  const cards = [
    {
      title: "Revenue Today",
      value: kpis.revenueToday,
      format: "currency",
      change: kpis.revenueTodayChange,
      sparkline: spark,
      icon: Banknote,
      color: dash.success,
      to: "/admin/orders"
    },
    {
      title: "Revenue This Week",
      value: kpis.revenueWeek,
      format: "currency",
      change: kpis.revenueWeekChange,
      sparkline: spark,
      icon: CalendarDays,
      color: dash.primary,
      to: "/admin/orders"
    },
    {
      title: "Revenue This Month",
      value: kpis.revenueMonth,
      format: "currency",
      change: kpis.revenueMonthChange,
      sparkline: spark,
      icon: CalendarRange,
      color: "#7c3aed",
      to: "/admin/orders"
    },
    {
      title: "Total Revenue",
      value: kpis.revenueTotal,
      format: "currency",
      icon: Calendar,
      color: dash.primary,
      to: "/admin/orders"
    },
    {
      title: "Orders Today",
      value: kpis.ordersToday,
      change: kpis.ordersTodayChange,
      sparkline: sparkOrders,
      icon: ShoppingCart,
      color: "#06b6d4",
      to: "/admin/orders"
    },
    {
      title: "Pending Orders",
      value: kpis.pendingOrders,
      icon: Clock,
      color: dash.warning,
      to: "/admin/orders"
    },
    {
      title: "Returns Awaiting",
      value: kpis.returnsAwaiting,
      icon: RotateCcw,
      color: "#ec4899",
      to: "/admin/returns"
    },
    {
      title: "Awaiting Shipment",
      value: kpis.awaitingShipment ?? 0,
      icon: Package,
      color: "#f59e0b",
      to: "/admin/orders",
      subtitle: "Paid or COD — not shipped yet"
    },
    {
      title: "Avg Order Value",
      value: kpis.aovMonth ?? 0,
      format: "currency",
      icon: TrendingUp,
      color: dash.primary,
      to: "/admin/orders",
      subtitle: "This month (paid orders)"
    }
  ];

  return (
    <DashGrid spacing={2}>
      {cards.map((c) => (
        <DashGridItem size={{ xs: 12, sm: 6, md: 3 }} key={c.title}>
          <KPICard {...c} />
        </DashGridItem>
      ))}
    </DashGrid>
  );
};
