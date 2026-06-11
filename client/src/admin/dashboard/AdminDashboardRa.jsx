import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useNotify } from "react-admin";
import { fetchDashboard } from "./dashboardApi";
import { exportDashboardPdf } from "./exportDashboardPdf";
import { exportSalesReportPdf } from "./exportSalesReportPdf";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { DashboardHeader } from "./DashboardHeader";
import { KPIGrid } from "./KPIGrid";
import { SalesAnalytics } from "./SalesAnalytics";
import { InventoryHealth } from "./InventoryHealth";
import { StockLookup } from "./StockLookup";
import { CustomerInsights } from "./CustomerInsights";
import { dash } from "./theme";

const sectionMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 }
};

export const AdminDashboardRa = () => {
  const notify = useNotify();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportingSales, setExportingSales] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await fetchDashboard();
      setData(payload);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleExportPdf = useCallback(() => {
    if (!data?.kpis) {
      notify("Load dashboard data before exporting.", { type: "warning" });
      return;
    }
    setExporting(true);
    try {
      const filename = exportDashboardPdf(data);
      notify(`Downloaded ${filename}`, { type: "success" });
    } catch (err) {
      notify(err?.message || "Could not export PDF", { type: "error" });
    } finally {
      setExporting(false);
    }
  }, [data, notify]);

  const handleExportSalesPdf = useCallback(() => {
    if (!data?.reports) {
      notify("Sales report data is not available yet.", { type: "warning" });
      return;
    }
    setExportingSales(true);
    try {
      const filename = exportSalesReportPdf(data);
      notify(`Downloaded ${filename}`, { type: "success" });
    } catch (err) {
      notify(err?.message || "Could not export sales report PDF", { type: "error" });
    } finally {
      setExportingSales(false);
    }
  }, [data, notify]);

  if (loading && !data) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <DashboardSkeleton />
      </Box>
    );
  }

  if (error && !data) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={load}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">No dashboard data available.</Typography>
        <Button variant="outlined" onClick={load} sx={{ mt: 2 }}>
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2 },
        minHeight: "100%",
        bgcolor: dash.bg,
        borderRadius: 2,
        mx: -1
      }}
    >
      <DashboardHeader
        generatedAt={data.generatedAt}
        loading={loading}
        exporting={exporting}
        exportingSales={exportingSales}
        onRefresh={load}
        onExportPdf={handleExportPdf}
        onExportSalesPdf={handleExportSalesPdf}
      />

      {data._legacy && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Limited dashboard data — restart the API so the full executive endpoint loads:{" "}
          <code>npm run dev:fix-port</code> then <code>npm run dev</code>
        </Alert>
      )}

      <motion.div {...sectionMotion}>
        <KPIGrid kpis={data.kpis} />
      </motion.div>

      <motion.div {...sectionMotion} transition={{ delay: 0.05 }}>
        <SalesAnalytics trends={data.trends} revenue={data.revenue} payments={data.payments} kpis={data.kpis} />
      </motion.div>

      <motion.div {...sectionMotion} transition={{ delay: 0.1 }}>
        <StockLookup />
      </motion.div>

      <motion.div {...sectionMotion} transition={{ delay: 0.12 }}>
        <InventoryHealth inventory={data.inventory} />
      </motion.div>

      <motion.div {...sectionMotion} transition={{ delay: 0.14 }}>
        <CustomerInsights customers={data.customers} />
      </motion.div>
    </Box>
  );
};
