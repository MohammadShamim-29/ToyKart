import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { Layers, Package } from "lucide-react";
import api from "../../api";
import { DashGrid, DashGridItem } from "./DashGrid";
import { dash } from "./theme";

const stockTone = (n) => {
  if (n <= 0) return dash.danger;
  if (n <= 5) return dash.warning;
  return dash.success;
};

export const StockLookup = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [detail, setDetail] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoadingCategories(true);
      setError("");
      try {
        const { data } = await api.get("/admin/inventory/categories");
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load categories");
      } finally {
        setLoadingCategories(false);
      }
    };
    load();
  }, []);

  const loadProducts = useCallback(async (categoryId) => {
    if (!categoryId) {
      setProducts([]);
      return;
    }
    setLoadingProducts(true);
    setError("");
    try {
      const { data } = await api.get("/admin/inventory/products", {
        params: { category: categoryId }
      });
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      setProducts([]);
      setError(err.response?.data?.message || "Could not load products");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const loadDetail = useCallback(async (productId) => {
    if (!productId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    setError("");
    try {
      const { data } = await api.get(`/admin/inventory/products/${productId}`);
      setDetail(data);
    } catch (err) {
      setDetail(null);
      setError(err.response?.data?.message || "Could not load stock details");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const onCategoryChange = (_, value) => {
    setSelectedCategory(value);
    setSelectedProduct(null);
    setDetail(null);
    setProducts([]);
    if (value?.id) {
      loadProducts(value.id);
    }
  };

  const onProductChange = (_, value) => {
    setSelectedProduct(value);
    if (value?.id) {
      loadDetail(value.id);
    } else {
      setDetail(null);
    }
  };

  const categoryOptions = useMemo(() => categories, [categories]);

  return (
    <Box sx={{ mt: 4 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Layers size={20} color={dash.primary} />
        <Typography variant="h6" fontWeight={800}>
          Stock lookup
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select a category, then a product, to view total stock and per-color variant stock.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Card sx={{ p: 2.5, borderRadius: dash.radius, boxShadow: dash.cardShadow, mb: 3 }}>
        <DashGrid spacing={2}>
          <DashGridItem size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={categoryOptions}
              loading={loadingCategories}
              value={selectedCategory}
              onChange={onCategoryChange}
              getOptionLabel={(opt) =>
                `${opt.name}${opt.productCount ? ` (${opt.productCount} products)` : ""}`
              }
              isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
              renderInput={(params) => (
                <TextField {...params} label="1. Category" placeholder="Search category…" />
              )}
            />
          </DashGridItem>
          <DashGridItem size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={products}
              loading={loadingProducts}
              disabled={!selectedCategory}
              value={selectedProduct}
              onChange={onProductChange}
              getOptionLabel={(opt) => `${opt.name} (${opt.sku})`}
              isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="2. Product"
                  placeholder={selectedCategory ? "Search product…" : "Select a category first"}
                />
              )}
            />
          </DashGridItem>
        </DashGrid>
      </Card>

      {loadingDetail ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      {detail && !loadingDetail ? (
        <Card sx={{ p: 2.5, borderRadius: dash.radius, boxShadow: dash.cardShadow }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
            {detail.image ? (
              <Box
                component="img"
                src={detail.image}
                alt=""
                sx={{ width: 72, height: 72, objectFit: "contain", borderRadius: 1, bgcolor: "#f8fafc" }}
              />
            ) : null}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                {detail.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SKU {detail.sku}
                {detail.category?.name ? ` · ${detail.category.name}` : ""}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                <Chip size="small" label={detail.status} variant="outlined" />
                {detail.hasVariants ? (
                  <Chip size="small" color="primary" variant="outlined" label={`${detail.variants.length} colors`} />
                ) : null}
              </Stack>
            </Box>
            <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Typography variant="caption" color="text.secondary">
                Total stock
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: stockTone(detail.countInStock) }}>
                {detail.countInStock}
              </Typography>
              {detail.hasVariants && detail.totalFromVariants !== detail.countInStock ? (
                <Typography variant="caption" color="warning.main">
                  Sum of variants: {detail.totalFromVariants}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          {detail.hasVariants ? (
            <>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Stock by color
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Color</TableCell>
                      <TableCell>Variant SKU</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell>Storefront</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.variants.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                bgcolor: v.colorCode,
                                border: "1px solid rgba(15,23,42,0.12)"
                              }}
                            />
                            <Typography fontWeight={600}>{v.colorName}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{v.sku || "—"}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={700} sx={{ color: stockTone(v.stock) }}>
                            {v.stock}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {v.isFeatured ? (
                            <Chip size="small" color="primary" label="Default" />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: "rgba(37, 99, 235, 0.06)" }}>
                      <TableCell colSpan={2}>
                        <Typography fontWeight={700}>Combined total</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={800}>{detail.totalFromVariants}</Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Package size={18} color={dash.muted} />
              <Typography color="text.secondary">
                This product has no color variants — stock is tracked as a single total above.
              </Typography>
            </Stack>
          )}
        </Card>
      ) : (
        !loadingDetail &&
        selectedCategory &&
        !selectedProduct && (
          <Typography color="text.secondary">Select a product to view stock details.</Typography>
        )
      )}
    </Box>
  );
};
