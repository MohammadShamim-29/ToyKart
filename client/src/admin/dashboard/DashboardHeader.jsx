import { Box, Button, Stack, Typography } from "@mui/material";
import { FileDown, RefreshCw } from "lucide-react";
import { formatDateTime } from "./dashboardUtils";

export const DashboardHeader = ({ generatedAt, loading, exporting, onRefresh, onExportPdf }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    justifyContent="space-between"
    alignItems={{ xs: "flex-start", sm: "center" }}
    spacing={2}
    sx={{ mb: 4 }}
  >
    <Box>
      <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
        Executive Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
        Real-time operations and revenue intelligence for ToyKart
        {generatedAt && (
          <Box component="span" sx={{ display: "block", fontSize: "0.8rem", mt: 0.5 }}>
            Updated {formatDateTime(generatedAt)}
          </Box>
        )}
      </Typography>
    </Box>
    <Stack direction="row" spacing={1}>
      <Button
        variant="outlined"
        startIcon={<RefreshCw size={18} />}
        onClick={onRefresh}
        disabled={loading}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        Refresh
      </Button>
      <Button
        variant="contained"
        startIcon={<FileDown size={18} />}
        onClick={onExportPdf}
        disabled={loading || exporting}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, boxShadow: "none" }}
      >
        {exporting ? "Exporting…" : "Export PDF"}
      </Button>
    </Stack>
  </Stack>
);
