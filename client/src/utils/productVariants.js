export const hasColorVariants = (product) =>
  Array.isArray(product?.colorVariants) && product.colorVariants.length > 0;

export const cartLineKey = (productId, variantId) =>
  `${productId || ""}:${variantId || ""}`;

export const variantGalleryImages = (variant, product) => {
  const primary = variant?.image || product?.image;
  const extras = Array.isArray(variant?.gallery) ? variant.gallery : [];
  const ordered = [primary, ...extras.filter((u) => u && u !== primary)];
  return [...new Set(ordered.filter(Boolean))];
};

const variantStock = (variant) => Math.max(0, Number(variant?.stock) || 0);

const isVariantInStock = (variant) => variantStock(variant) > 0;

/** Admin-marked storefront default (ignores stock — use for admin/sync only). */
export const featuredVariant = (product) => {
  const variants = product?.colorVariants;
  if (!Array.isArray(variants) || variants.length === 0) return null;
  return variants.find((v) => v.isFeatured) ?? variants[0] ?? null;
};

/**
 * Variant to show on cards and use when none is selected.
 * Prefers the featured color when it has stock; otherwise the first in-stock variant.
 */
export const defaultVariant = (product) => {
  const variants = product?.colorVariants;
  if (!Array.isArray(variants) || variants.length === 0) return null;

  const featured = featuredVariant(product);
  if (featured && isVariantInStock(featured)) return featured;

  return (
    variants.find((v) => isVariantInStock(v) && v.image) ??
    variants.find((v) => isVariantInStock(v)) ??
    featured
  );
};

/** Shop cards, quick view, related products — same stock-aware pick as cart/PDP default. */
export const cardDisplayVariant = (product) => defaultVariant(product);

export const cardDisplayImage = (product, variant = null) => {
  const v = variant ?? cardDisplayVariant(product);
  if (v?.image) return v.image;
  return product?.image ?? "";
};

export const resolveVariantFromParam = (product, param) => {
  if (!hasColorVariants(product)) return null;
  const variants = product.colorVariants;
  if (!param) return defaultVariant(product);

  const raw = String(param).trim();
  const byId = variants.find((v) => String(v._id) === raw);
  if (byId) return byId;

  const slug = raw.toLowerCase().replace(/\s+/g, "-");
  const byName = variants.find((v) => {
    const name = String(v.colorName || "").trim().toLowerCase();
    return name === raw.toLowerCase() || name.replace(/\s+/g, "-") === slug;
  });
  return byName ?? defaultVariant(product);
};

export const productDetailPath = (productId, variant = null) => {
  const base = `/product/${productId}`;
  if (!variant?._id) return base;
  return `${base}?variant=${variant._id}`;
};

export const getStockStatusLabel = (stock) => {
  const n = Math.max(0, Number(stock) || 0);
  if (n === 0) return "Out of Stock";
  if (n <= 2) return `Only ${n} Left`;
  return "In Stock";
};

export const stockStatusClass = (stock) => {
  const n = Math.max(0, Number(stock) || 0);
  if (n === 0) return "pd-stock--bad";
  if (n <= 2) return "pd-stock--low";
  return "pd-stock--ok";
};

/** Normalize variants before admin save */
export const prepareVariantsForSave = (variants) => {
  if (!Array.isArray(variants) || variants.length === 0) return variants;
  let featuredIndex = variants.findIndex((v) => v.isFeatured);
  if (featuredIndex < 0) featuredIndex = 0;
  return variants.map((v, i) => ({ ...v, isFeatured: i === featuredIndex }));
};

export const syncProductFieldsFromVariants = (data) => {
  const variants = prepareVariantsForSave(data?.colorVariants);
  if (!variants?.length) return data;
  const featured = variants.find((v) => v.isFeatured) ?? variants[0];
  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  return {
    ...data,
    colorVariants: variants,
    countInStock: totalStock,
    image: featured?.image || data.image,
    gallery: Array.isArray(featured?.gallery) && featured.gallery.length > 0 ? featured.gallery : data.gallery ?? []
  };
};
