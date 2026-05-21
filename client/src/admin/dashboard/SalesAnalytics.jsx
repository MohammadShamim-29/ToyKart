import { Box, Card, Stack, Typography } from "@mui/material";
import { DashGrid, DashGridItem } from "./DashGrid";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { BarChart3, LineChart as LineIcon } from "lucide-react";
import { CHART_COLORS, dash } from "./theme";
import { formatBdt, formatShortDate } from "./dashboardUtils";

const Panel = ({ title, icon: Icon, children, height = 320 }) => (
  <Card sx={{ p: 2.5, borderRadius: dash.radius, boxShadow: dash.cardShadow, height: "100%" }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
      {Icon && <Icon size={18} color={dash.muted} />}
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
    </Stack>
    <Box sx={{ height, width: "100%" }}>{children}</Box>
  </Card>
);

const ChartTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "#fff", p: 1.5, borderRadius: 2, boxShadow: dash.cardShadow, border: "1px solid #e2e8f0" }}>
      <Typography variant="caption" fontWeight={700}>
        {formatShortDate(label) || label}
      </Typography>
      {payload.map((p) => (
        <Typography key={p.name} variant="body2" sx={{ color: p.color }}>
          {p.name}: {currency ? formatBdt(p.value) : p.value}
        </Typography>
      ))}
    </Box>
  );
};

export const SalesAnalytics = ({ trends, revenue, payments, kpis }) => {
  const daily = trends?.daily || [];
  const categories = revenue?.salesByCategory || [];
  const paymentMix = payments?.mix || [];
  const heatmap = trends?.revenueHeatmap || [];

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        Sales Analytics
      </Typography>
      <DashGrid spacing={3}>
        <DashGridItem size={{ xs: 12, lg: 8 }}>
          <Panel title="Revenue trend (30 days)" icon={LineIcon} height={340}>
            <ResponsiveContainer>
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={dash.primary} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={dash.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11, fill: dash.muted }} />
                <YAxis tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: dash.muted }} />
                <Tooltip content={<ChartTooltip currency />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={dash.primary} fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, lg: 4 }}>
          <Panel title="Payment mix" height={340}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={paymentMix} dataKey="amount" nameKey="method" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {paymentMix.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatBdt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, md: 6 }}>
          <Panel title="Orders trend" height={280}>
            <ResponsiveContainer>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" name="All orders" stroke="#94a3b8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="paidOrders" name="Paid" stroke={dash.success} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, md: 6 }}>
          <Panel title="Average order value" height={280}>
            <ResponsiveContainer>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `৳${v}`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatBdt(v)} />
                <Line type="monotone" dataKey="aov" name="AOV" stroke={dash.warning} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Month AOV: {formatBdt(kpis?.aovMonth)}
            </Typography>
          </Panel>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, lg: 8 }}>
          <Panel title="Sales by category" icon={BarChart3} height={300}>
            <ResponsiveContainer>
              <BarChart data={categories} margin={{ bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" angle={-20} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatBdt(v)} />
                <Bar dataKey="totalAmount" name="Sales" radius={[6, 6, 0, 0]}>
                  {categories.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, lg: 4 }}>
          <Panel title="Revenue by weekday (4 weeks)" height={300}>
            <ResponsiveContainer>
              <BarChart data={heatmap}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatBdt(v)} />
                <Bar dataKey="revenue" fill={dash.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </DashGridItem>
      </DashGrid>
    </Box>
  );
};
