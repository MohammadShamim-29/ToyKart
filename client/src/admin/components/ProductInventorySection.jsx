import { useEffect, useState } from "react";
import { useRecordContext } from "react-admin";
import { useFormContext } from "react-hook-form";
import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography
} from "@mui/material";
import ColorVariantsInput from "./ColorVariantsInput";
import { ProductGalleryInput, ProductImageInput } from "./ProductSimpleMediaInputs";

const emptyVariant = () => ({
  colorName: "",
  colorCode: "#3b82f6",
  stock: 0,
  sku: "",
  image: "",
  gallery: [],
  isFeatured: true
});

const ProductInventorySection = () => {
  const record = useRecordContext();
  const { setValue, watch } = useFormContext();
  const variants = watch("colorVariants") ?? [];
  const [mode, setMode] = useState("simple");

  useEffect(() => {
    if (!record?.id) {
      setMode("simple");
      setValue("hasColorVariants", false, { shouldDirty: false });
      return;
    }
    const hasVariants = Array.isArray(record.colorVariants) && record.colorVariants.length > 0;
    setMode(hasVariants ? "variants" : "simple");
    setValue("hasColorVariants", hasVariants, { shouldDirty: false });
  }, [record?.id, record?.colorVariants, setValue]);

  const selectSimple = () => {
    setMode("simple");
    setValue("hasColorVariants", false, { shouldDirty: true });
    setValue("colorVariants", [], { shouldDirty: true });
  };

  const selectVariants = () => {
    setMode("variants");
    setValue("hasColorVariants", true, { shouldDirty: true });
    if (!Array.isArray(variants) || variants.length === 0) {
      setValue("colorVariants", [emptyVariant()], { shouldDirty: true });
    }
  };

  return (
    <Box width="100%">
      <FormControl component="fieldset" sx={{ mb: 2, width: "100%" }}>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          How do you want to manage this product?
        </Typography>
        <RadioGroup
          value={mode}
          onChange={(e) => (e.target.value === "variants" ? selectVariants() : selectSimple())}
        >
          <FormControlLabel
            value="simple"
            control={<Radio />}
            label={
              <Box>
                <Typography fontWeight={600}>No color variants</Typography>
                <Typography variant="caption" color="text.secondary">
                  One image, one stock count — best for products that do not come in colors.
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="variants"
            control={<Radio />}
            label={
              <Box>
                <Typography fontWeight={600}>Multiple colors</Typography>
                <Typography variant="caption" color="text.secondary">
                  Separate image, gallery, and stock for each color (e.g. Red, Blue).
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>

      {mode === "simple" ? (
        <Stack spacing={2}>
          <ProductImageInput
            source="image"
            label="Product image"
            helperText="Main photo shown on shop cards and the product page."
          />
          <ProductGalleryInput source="gallery" />
        </Stack>
      ) : (
        <ColorVariantsInput source="colorVariants" />
      )}
    </Box>
  );
};

export default ProductInventorySection;
