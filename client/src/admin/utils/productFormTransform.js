import { syncProductFieldsFromVariants } from "../../utils/productVariants";

export const transformProductForSave = (data) => {
  const { hasColorVariants, ...rest } = data ?? {};
  if (!hasColorVariants) {
    return {
      ...rest,
      colorVariants: []
    };
  }
  return syncProductFieldsFromVariants({ ...rest, colorVariants: rest.colorVariants ?? [] });
};
