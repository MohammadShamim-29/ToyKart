import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { dash } from "./theme";
import { formatBdt, formatPct, trendDirection } from "./dashboardUtils";

const MotionCard = motion.create(Card);

export const KPICard = ({
  title,
  value,
  format = "number",
  change,
  sparkline = [],
  icon: Icon,
  color = dash.primary,
  to,
  subtitle
}) => {
  const display =
    format === "currency" ? formatBdt(value) : format === "percent" ? formatPct(value) : Number(value).toLocaleString();

  const trend = change != null ? trendDirection(change) : null;
  const sparkData = sparkline.map((v, i) => ({ i, v }));

  const inner = (
    <MotionCard
      whileHover={to ? { y: -4, boxShadow: dash.cardHover } : undefined}
      sx={{
        height: "100%",
        borderRadius: dash.radius,
        boxShadow: dash.cardShadow,
        textDecoration: "none",
        color: "inherit",
        cursor: to ? "pointer" : "default",
        border: "1px solid rgba(15, 23, 42, 0.06)",
        transition: "box-shadow 0.2s"
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: `${color}18`,
                color,
                display: "flex"
              }}
            >
              {Icon && <Icon size={22} strokeWidth={2} />}
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {title}
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2, mt: 0.25 }}>
                {display}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
          {change != null && (
            <Stack direction="row" alignItems="center" spacing={0.25} sx={{ color: trend === "up" ? dash.success : dash.danger }}>
              {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <Typography variant="caption" fontWeight={700}>
                {formatPct(change)}
              </Typography>
            </Stack>
          )}
        </Stack>
        {sparkData.length > 1 && (
          <Box sx={{ height: 40, mt: 2, opacity: 0.85 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </MotionCard>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: "none", display: "block", height: "100%" }}>
        {inner}
      </Link>
    );
  }
  return inner;
};
