import { Box, Card, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from "@mui/material";
import { DashGrid, DashGridItem } from "./DashGrid";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { CalendarDays, BarChart3, Package } from "lucide-react";
import { CHART_COLORS, dash } from "./theme";
import { formatBdt } from "./dashboardUtils";

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

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "#fff", p: 1.5, borderRadius: 2, boxShadow: dash.cardShadow, border: "1px solid #e2e8f0" }}>
      <Typography variant="caption" fontWeight={700}>
        {label}
      </Typography>
      {payload.map((p) => (
        <Typography key={p.name} variant="body2" sx={{ color: p.color }}>
          {p.name}: {p.name === "Orders" ? p.value : formatBdt(p.value)}
        </Typography>
      ))}
    </Box>
  );
};

const MonthlySalesChart = ({ data }) => (
  <ResponsiveContainer>
    <BarChart data={data} margin={{ bottom: 16 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
      <YAxis yAxisId="left" tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
      <Tooltip content={<ChartTooltip />} />
      <Legend />
      <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={dash.primary} radius={[6, 6, 0, 0]} />
      <Bar yAxisId="right" dataKey="orders" name="Orders" fill={dash.success} radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

const WeeklyCategoryTable = ({ data }) => {
  if (!data || data.length === 0) return <Typography color="text.secondary">No data available.</Typography>;

  const weeks = [...new Set(data.map((r) => r.week))].sort();
  const categories = [...new Set(data.map((r) => r.category))];

  return (
    <TableContainer sx={{ maxHeight: 260 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Week</TableCell>
            {categories.map((cat) => (
              <TableCell key={cat} sx={{ fontWeight: 700, fontSize: 11 }} align="right">
                {cat}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {weeks.map((week) => (
            <TableRow key={week} hover>
              <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{week}</TableCell>
              {categories.map((cat) => {
                const row = data.find((r) => r.week === week && r.category === cat);
                return (
                  <TableCell key={cat} align="right" sx={{ fontSize: 11 }}>
                    {row ? formatBdt(row.revenue) : "—"}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const WeeklyProductTable = ({ data }) => {
  if (!data || data.length === 0) return <Typography color="text.secondary">No data available.</Typography>;

  const weeks = [...new Set(data.map((r) => r.week))].sort();
  const products = [...new Set(data.map((r) => r.product))].slice(0, 15);

  return (
    <TableContainer sx={{ maxHeight: 260 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Product</TableCell>
            {weeks.map((week) => (
              <TableCell key={week} sx={{ fontWeight: 700, fontSize: 11 }} align="right">
                {week}
              </TableCell>
            ))}
            <TableCell sx={{ fontWeight: 700, fontSize: 11 }} align="right">
              Total
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => {
            const productRows = data.filter((r) => r.product === product);
            const totalRevenue = productRows.reduce((s, r) => s + r.revenue, 0);
            return (
              <TableRow key={product} hover>
                <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{product}</TableCell>
                {weeks.map((week) => {
                  const row = productRows.find((r) => r.week === week);
                  return (
                    <TableCell key={week} align="right" sx={{ fontSize: 11 }}>
                      {row ? formatBdt(row.revenue) : "—"}
                    </TableCell>
                  );
                })}
                <TableCell align="right" sx={{ fontSize: 11, fontWeight: 700 }}>
                  {formatBdt(totalRevenue)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const SalesReports = ({ reports }) => {
  const monthlyData = reports?.monthlySales || [];
  const weeklyCategoryData = reports?.weeklyCategorySales || [];
  const weeklyProductData = reports?.weeklyProductSales || [];

  const categories = [...new Set(weeklyCategoryData.map((r) => r.category))];

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        Sales Reports
      </Typography>
      <DashGrid spacing={3}>
        <DashGridItem size={{ xs: 12, lg: 8 }}>
          <Panel title="Monthly sales (12 months)" icon={CalendarDays} height={340}>
            <MonthlySalesChart data={monthlyData} />
          </Panel>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, lg: 4 }}>
          <Card sx={{ p: 2.5, borderRadius: dash.radius, boxShadow: dash.cardShadow, height: "100%" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <BarChart3 size={18} color={dash.muted} />
              <Typography variant="subtitle1" fontWeight={700}>
                Category summary
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              {categories.slice(0, 8).map((cat, i) => {
                const total = weeklyCategoryData
                  .filter((r) => r.category === cat)
                  .reduce((s, r) => s + r.revenue, 0);
                return (
                  <Stack key={cat} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <Typography variant="body2">{cat}</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight={700}>
                      {formatBdt(total)}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Card>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, lg: 6 }}>
          <Panel title="Weekly sales by category (8 weeks)" icon={BarChart3} height={340}>
            <WeeklyCategoryTable data={weeklyCategoryData} />
          </Panel>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, lg: 6 }}>
          <Panel title="Weekly sales by product (8 weeks)" icon={Package} height={340}>
            <WeeklyProductTable data={weeklyProductData} />
          </Panel>
        </DashGridItem>
      </DashGrid>
    </Box>
  );
};
