import { Box, Card, Stack, Typography } from "@mui/material";
import { DashGrid, DashGridItem } from "./DashGrid";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, UserPlus, Repeat } from "lucide-react";
import { dash } from "./theme";
import { formatBdt, formatShortDate } from "./dashboardUtils";
import { KPICard } from "./KPICard";

export const CustomerInsights = ({ customers }) => {
  const growth = customers?.growth || [];
  const top = customers?.topBuyers || [];

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        Customer Insights
      </Typography>
      <DashGrid spacing={2} sx={{ mb: 3 }}>
        <DashGridItem size={{ xs: 12, sm: 4 }}>
          <KPICard title="Total customers" value={customers?.total} icon={Users} color={dash.primary} to="/admin/users" />
        </DashGridItem>
        <DashGridItem size={{ xs: 12, sm: 4 }}>
          <KPICard title="New this week" value={customers?.newThisWeek} icon={UserPlus} color={dash.success} to="/admin/users" />
        </DashGridItem>
        <DashGridItem size={{ xs: 12, sm: 4 }}>
          <KPICard title="Repeat buyers" value={customers?.repeatCustomers} icon={Repeat} color="#7c3aed" to="/admin/users" />
        </DashGridItem>
      </DashGrid>
      <DashGrid spacing={3}>
        <DashGridItem size={{ xs: 12, md: 7 }}>
          <Card sx={{ p: 2.5, borderRadius: dash.radius, boxShadow: dash.cardShadow }}>
            <Typography fontWeight={700} sx={{ mb: 2 }}>
              Signups (30 days)
            </Typography>
            <Box sx={{ height: 240 }}>
              <ResponsiveContainer>
                <AreaChart data={growth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke={dash.success} fill={`${dash.success}30`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2.5, borderRadius: dash.radius, boxShadow: dash.cardShadow, height: "100%" }}>
            <Typography fontWeight={700} sx={{ mb: 2 }}>
              Top buyers
            </Typography>
            {top.length === 0 ? (
              <Typography color="text.secondary">No paid orders yet.</Typography>
            ) : (
              top.map((b, i) => (
                <Stack key={b.email} direction="row" justifyContent="space-between" sx={{ py: 1.25, borderBottom: "1px solid #f1f5f9" }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {i + 1}. {b.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {b.orderCount} orders
                    </Typography>
                  </Box>
                  <Typography fontWeight={700}>{formatBdt(b.totalSpent)}</Typography>
                </Stack>
              ))
            )}
          </Card>
        </DashGridItem>
      </DashGrid>
    </Box>
  );
};
