import { Card, CardContent, Typography, Box, Button, Stack } from "@mui/material";
import CategoryIcon from "@mui/icons-material/Category";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useGetList } from "react-admin";
import { Link as RouterLink } from "react-router-dom";

const StatCard = ({ title, value, icon: Icon, to, loading }) => (
  <Card elevation={2} sx={{ height: "100%" }}>
    <CardContent>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="p" fontWeight={600}>
            {loading ? "—" : value}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex"
          }}
        >
          <Icon />
        </Box>
      </Stack>
      {to && (
        <Button component={RouterLink} to={to} size="small" sx={{ mt: 2 }} variant="text">
          Manage
        </Button>
      )}
    </CardContent>
  </Card>
);

export const AdminDashboardRa = () => {
  const { total: categoriesTotal, isLoading: loadingCat } = useGetList("categories", {
    pagination: { page: 1, perPage: 1 },
    sort: { field: "sortOrder", order: "ASC" }
  });
  const { total: productsTotal, isLoading: loadingProd } = useGetList("products", {
    pagination: { page: 1, perPage: 1 },
    sort: { field: "createdAt", order: "DESC" }
  });
  const { total: ordersTotal, isLoading: loadingOrders } = useGetList("orders", {
    pagination: { page: 1, perPage: 1 },
    sort: { field: "createdAt", order: "DESC" }
  });

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 560 }}>
        Manage ToyKart catalog data. Use the sidebar for categories and products, or open the storefront any time.
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }
        }}
      >
        <StatCard
          title="Categories"
          value={categoriesTotal ?? 0}
          icon={CategoryIcon}
          to="categories"
          loading={loadingCat}
        />
        <StatCard
          title="Products"
          value={productsTotal ?? 0}
          icon={Inventory2Icon}
          to="products"
          loading={loadingProd}
        />
        <StatCard
          title="Orders"
          value={ordersTotal ?? 0}
          icon={ReceiptLongIcon}
          to="orders"
          loading={loadingOrders}
        />
      </Box>
    </Box>
  );
};
