import { useEffect } from "react";
import { NumberInput } from "react-admin";
import { useFormContext, useWatch } from "react-hook-form";
import { TextField as MuiTextField } from "@mui/material";

const sumVariantStock = (variants) => {
  if (!Array.isArray(variants)) return 0;
  return variants.reduce((sum, v) => sum + Math.max(0, Number(v?.stock) || 0), 0);
};

const ProductCountInStockInput = () => {
  const { setValue } = useFormContext();
  const hasColorVariants = useWatch({ name: "hasColorVariants" });
  const variants = useWatch({ name: "colorVariants" }) ?? [];
  const hasVariants = Boolean(hasColorVariants) && Array.isArray(variants) && variants.length > 0;
  const totalStock = sumVariantStock(variants);

  useEffect(() => {
    if (hasVariants) {
      setValue("countInStock", totalStock, { shouldDirty: true, shouldValidate: true });
    }
  }, [hasVariants, totalStock, setValue]);

  if (hasVariants) {
    return (
      <MuiTextField
        label="Total stock"
        value={totalStock}
        fullWidth
        disabled
        helperText="Auto-calculated from the stock you enter for each color below."
      />
    );
  }

  return (
    <NumberInput
      source="countInStock"
      min={0}
      step={1}
      fullWidth
      helperText="Total units in stock for this product."
    />
  );
};

export default ProductCountInStockInput;
