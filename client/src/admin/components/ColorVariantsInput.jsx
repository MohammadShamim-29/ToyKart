import { useEffect } from "react";
import { useInput, useNotify } from "react-admin";
import { useFormContext } from "react-hook-form";
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  Paper,
  Radio,
  Stack,
  TextField as MuiTextField,
  Typography
} from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import api from "../../api";

const emptyVariant = (isFeatured = false) => ({
  colorName: "",
  colorCode: "#3b82f6",
  stock: 0,
  sku: "",
  image: "",
  gallery: [],
  isFeatured
});

const VariantImageField = ({ label, value, onChange, required }) => {
  const notify = useNotify();

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/upload", fd);
      onChange(data.url);
      notify("Image uploaded", { type: "success" });
    } catch (err) {
      notify(err.response?.data?.message || "Upload failed", { type: "error" });
    }
  };

  return (
    <Stack spacing={1}>
      <Typography variant="caption" fontWeight={600} color="text.secondary">
        {label}
        {required ? " *" : ""}
      </Typography>
      <Button variant="contained" component="label" size="small" sx={{ alignSelf: "flex-start" }}>
        Upload image
        <input type="file" accept="image/*" hidden onChange={onPick} />
      </Button>
      <MuiTextField
        size="small"
        label="Image URL"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        required={required}
      />
      {value ? (
        <Box
          component="img"
          src={value}
          alt=""
          sx={{
            maxWidth: 200,
            maxHeight: 160,
            objectFit: "contain",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider"
          }}
        />
      ) : null}
    </Stack>
  );
};

const VariantGalleryField = ({ value, onChange }) => {
  const notify = useNotify();
  const list = Array.isArray(value) ? value : [];

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          const { data } = await api.post("/admin/upload", fd);
          return data.url;
        })
      );
      onChange([...list, ...urls]);
      notify("Gallery images uploaded", { type: "success" });
    } catch (err) {
      notify(err.response?.data?.message || "Upload failed", { type: "error" });
    }
  };

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        Extra photos for this color (product page thumbnails)
      </Typography>
      <Button variant="outlined" component="label" size="small" sx={{ alignSelf: "flex-start" }}>
        Add gallery images
        <input type="file" accept="image/*" hidden multiple onChange={onPick} />
      </Button>
      {list.map((url, index) => (
        <Paper key={`${url}-${index}`} variant="outlined" sx={{ p: 1, display: "flex", gap: 1, alignItems: "center" }}>
          <Box component="img" src={url} alt="" sx={{ width: 48, height: 48, objectFit: "cover", borderRadius: 1 }} />
          <MuiTextField
            size="small"
            fullWidth
            value={url}
            onChange={(e) => {
              const next = [...list];
              next[index] = e.target.value;
              onChange(next);
            }}
          />
          <IconButton size="small" aria-label="Remove" onClick={() => onChange(list.filter((_, i) => i !== index))}>
            <Trash2 size={18} />
          </IconButton>
        </Paper>
      ))}
    </Stack>
  );
};

const sumVariantStock = (variants) =>
  variants.reduce((sum, v) => sum + Math.max(0, Number(v?.stock) || 0), 0);

const ColorVariantsInput = (props) => {
  const { setValue } = useFormContext();
  const { field } = useInput({ ...props, defaultValue: [] });
  const list = Array.isArray(field.value) ? field.value : [];
  const totalStock = sumVariantStock(list);

  useEffect(() => {
    if (list.length > 0) {
      setValue("countInStock", totalStock, { shouldDirty: true, shouldValidate: true });
    }
  }, [list, totalStock, setValue]);

  const updateAt = (index, patch) => {
    const next = list.map((row, i) => (i === index ? { ...row, ...patch } : row));
    field.onChange(next);
  };

  const setFeatured = (index) => {
    field.onChange(list.map((row, i) => ({ ...row, isFeatured: i === index })));
  };

  const removeAt = (index) => {
    const next = list.filter((_, i) => i !== index);
    if (next.length && !next.some((v) => v.isFeatured)) {
      next[0] = { ...next[0], isFeatured: true };
    }
    field.onChange(next);
  };

  const addVariant = () => {
    field.onChange([...list, emptyVariant(list.length === 0)]);
  };

  return (
    <Box width="100%">
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
        Product images, colors & stock
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        Upload one row per color. Mark <strong>Storefront default</strong> for the image shown on shop cards
        and the color opened first on the product page. Combined stock: <strong>{totalStock}</strong> units
        (updates the Total stock field above automatically).
      </Typography>
      <Button variant="contained" size="small" startIcon={<Plus size={18} />} onClick={addVariant} sx={{ mb: 2 }}>
        Add another color
      </Button>
      <Stack spacing={2}>
        {list.map((variant, index) => {
          const isFeatured = Boolean(variant.isFeatured);
          return (
            <Paper
              key={variant._id || `new-${index}`}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                borderColor: isFeatured ? "primary.main" : "divider",
                borderWidth: isFeatured ? 2 : 1
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography fontWeight={600}>
                    {isFeatured ? "Storefront color" : `Color ${index + 1}`}
                  </Typography>
                  {isFeatured ? <Chip size="small" color="primary" label="Shop & product page default" /> : null}
                </Stack>
                <IconButton
                  aria-label="Remove color"
                  onClick={() => removeAt(index)}
                  size="small"
                  disabled={list.length === 1}
                >
                  <Trash2 size={20} />
                </IconButton>
              </Stack>
              <Stack spacing={1.5}>
                <FormControlLabel
                  control={
                    <Radio
                      checked={isFeatured}
                      onChange={() => setFeatured(index)}
                      name="featured-variant"
                    />
                  }
                  label="Use on product cards & open first on product page"
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <MuiTextField
                    label="Color name"
                    value={variant.colorName ?? ""}
                    onChange={(e) => updateAt(index, { colorName: e.target.value })}
                    fullWidth
                    required
                    placeholder="e.g. Red"
                  />
                  <MuiTextField
                    label="Color"
                    type="color"
                    value={variant.colorCode || "#3b82f6"}
                    onChange={(e) => updateAt(index, { colorCode: e.target.value })}
                    sx={{ width: { xs: "100%", sm: 120 }, minWidth: 120 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <MuiTextField
                    label="Stock for this color"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={variant.stock ?? 0}
                    onChange={(e) => updateAt(index, { stock: Number(e.target.value) || 0 })}
                    fullWidth
                    required
                  />
                  <MuiTextField
                    label="SKU (optional)"
                    value={variant.sku ?? ""}
                    onChange={(e) => updateAt(index, { sku: e.target.value })}
                    fullWidth
                  />
                </Stack>
                <VariantImageField
                  label="Main image for this color"
                  value={variant.image}
                  onChange={(url) => updateAt(index, { image: url })}
                  required={isFeatured}
                />
                <VariantGalleryField
                  value={variant.gallery}
                  onChange={(gallery) => updateAt(index, { gallery })}
                />
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
};

export default ColorVariantsInput;
