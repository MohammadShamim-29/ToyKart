import { dash } from "./theme";

export const formatBdt = (n) => {
  const v = Number(n) || 0;
  return `৳${v.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
};

export const formatPct = (n) => {
  const v = Number(n) || 0;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v}%`;
};

export const trendDirection = (pct) => (Number(pct) >= 0 ? "up" : "down");

export const statusColor = (status) => {
  const s = String(status || "").toLowerCase();
  const map = {
    pending: dash.warning,
    confirmed: dash.primary,
    processing: "#7c3aed",
    shipped: "#06b6d4",
    delivered: dash.success,
    cancelled: dash.danger,
    returned: "#f43f5e",
    refunded: dash.muted,
    success: dash.success,
    failed: dash.danger,
    refund_approved: dash.primary
  };
  return map[s] || dash.muted;
};

export const severityColor = (severity) => {
  if (severity === "high") return dash.danger;
  if (severity === "medium") return dash.warning;
  return dash.success;
};

export const statusLabel = (s) =>
  String(s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const formatShortDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-BD", { month: "short", day: "numeric" });
};

export const formatDateTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-BD", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};
