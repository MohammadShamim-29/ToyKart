import { Box, Card, Stack, Typography, Avatar } from "@mui/material";
import { DashGrid, DashGridItem } from "./DashGrid";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Package, ShoppingBag, Trophy } from "lucide-react";
import { CHART_COLORS, dash } from "./theme";
import { formatBdt } from "./dashboardUtils";

const StatBox = ({ label, value, color }) => (
  <Box sx={{ p: 2, borderRadius: 2, bgcolor: `${color}10`, border: `1px solid ${color}30` }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h5" fontWeight={800} sx={{ color }}>
      {value}
    </Typography>
  </Box>
);

const ProductSoldRow = ({ product, rank }) => (
  <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
    {rank != null ? (
      <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ minWidth: 18 }}>
        {rank}
      </Typography>
    ) : null}
    <Avatar src={product.image} variant="rounded" sx={{ width: 40, height: 40 }} />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="body2"
        fontWeight={600}
        component={product.id ? Link : "span"}
        to={product.id ? `/admin/products/${product.id}` : undefined}
        sx={{ textDecoration: "none", color: "inherit", display: "block" }}
        noWrap
      >
        {product.name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {product.unitsSold} sold
        {product.revenue != null ? ` · ${formatBdt(product.revenue)}` : ""}
        {product.sku ? ` · ${product.sku}` : ""}
      </Typography>
    </Box>
  </Stack>
);

export const InventoryHealth = ({ inventory }) => {
  const low = inventory?.lowStockProducts || [];
  const topSold = inventory?.topSoldProducts || [];
  const topByCategory = inventory?.topSoldByCategory || [];
  const dead = inventory?.deadInventory || [];
  const stockDist = (inventory?.stockDistribution || []).map((b) => ({
    range: b.range === "0" ? "Out" : b.range,
    count: b.count
  }));

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        Inventory Health
      </Typography>
      <DashGrid spacing={3}>
        <DashGridItem size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <StatBox label="Out of stock (active)" value={inventory?.outOfStockCount ?? 0} color={dash.danger} />
            <StatBox label="Inactive SKUs" value={inventory?.inactiveProductsCount ?? 0} color={dash.muted} />
            <StatBox label="Low stock alerts" value={low.length} color={dash.warning} />
          </Stack>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2.5, borderRadius: dash.radius, boxShadow: dash.cardShadow }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Stock distribution
            </Typography>
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={stockDist}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stockDist.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2.5, borderRadius: dash.radius, boxShadow: dash.cardShadow }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Package size={18} color={dash.warning} />
              <Typography fontWeight={700}>Low stock</Typography>
            </Stack>
            {low.length === 0 ? (
              <Typography color="text.secondary">All active products above threshold.</Typography>
            ) : (
              low.map((p) => (
                <Stack key={p.id} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: "1px solid #f1f5f9" }}>
                  <Box component={Link} to={`/admin/products/${p.id}`} sx={{ textDecoration: "none", color: "inherit" }}>
                    <Typography variant="body2" fontWeight={600}>
                      {p.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.sku} · {p.category}
                    </Typography>
                  </Box>
                  <Typography fontWeight={700} color="warning.main">
                    {p.countInStock}
                  </Typography>
                </Stack>
              ))
            )}
          </Card>
        </DashGridItem>
        <DashGridItem size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2.5, borderRadius: dash.radius, boxShadow: dash.cardShadow, height: "100%" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Trophy size={18} color={dash.success} />
              <Typography fontWeight={700}>Overall top sold products</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
              Delivered orders only — excludes cancelled, refunded, and returned (replacement delivered still
              counts).
            </Typography>
            {topSold.length === 0 ? (
              <Typography color="text.secondary">No qualifying sales yet.</Typography>
            ) : (
              topSold.map((p, idx) => <ProductSoldRow key={p.id} product={p} rank={idx + 1} />)
            )}
          </Card>
        </DashGridItem>
        <DashGridItem size={{ xs: 12 }}>
          <Card sx={{ p: 2.5, borderRadius: dash.radius, boxShadow: dash.cardShadow }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <ShoppingBag size={18} color={dash.primary} />
              <Typography fontWeight={700}>Top sold product by category</Typography>
            </Stack>
            {topByCategory.length === 0 ? (
              <Typography color="text.secondary">No category sales data yet.</Typography>
            ) : (
              <DashGrid spacing={2}>
                {topByCategory.map((row) => (
                  <DashGridItem size={{ xs: 12, sm: 6, md: 4 }} key={row.categoryId || row.categoryName}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid rgba(15, 23, 42, 0.08)",
                        bgcolor: "rgba(15, 23, 42, 0.02)",
                        height: "100%"
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} color="primary.main" textTransform="uppercase">
                        {row.categoryName}
                      </Typography>
                      <ProductSoldRow product={row.product} />
                    </Box>
                  </DashGridItem>
                ))}
              </DashGrid>
            )}
            {dead.length > 0 && (
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  Dead inventory (catalog soldCount 0, 60d+)
                </Typography>
                {dead.map((p) => (
                  <Typography key={p.id} variant="body2" sx={{ mt: 0.5 }}>
                    {p.name} — {p.countInStock} units
                  </Typography>
                ))}
              </Box>
            )}
          </Card>
        </DashGridItem>
      </DashGrid>
    </Box>
  );
};
