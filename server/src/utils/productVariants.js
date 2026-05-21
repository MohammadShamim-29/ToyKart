import mongoose from "mongoose";
import Product from "../models/Product.js";

export function hasColorVariants(product) {
  return Array.isArray(product?.colorVariants) && product.colorVariants.length > 0;
}

export function normalizeColorVariants(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const colorName = String(entry?.colorName ?? entry?.color_name ?? "").trim();
      if (!colorName) return null;

      let gallery = entry?.gallery;
      if (typeof gallery === "string") {
        gallery = gallery
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (!Array.isArray(gallery)) {
        gallery = [];
      }

      const variant = {
        colorName,
        colorCode: String(entry?.colorCode ?? entry?.color_code ?? "#cccccc").trim() || "#cccccc",
        stock: Math.max(0, Number(entry?.stock) || 0),
        sku: entry?.sku ? String(entry.sku).trim().toUpperCase() : "",
        image: String(entry?.image ?? "").trim(),
        gallery: gallery.map((url) => String(url).trim()).filter(Boolean),
        isFeatured: Boolean(entry?.isFeatured)
      };

      const id = entry?._id ?? entry?.id;
      if (id && mongoose.Types.ObjectId.isValid(String(id))) {
        variant._id = new mongoose.Types.ObjectId(String(id));
      }

      return variant;
    })
    .filter(Boolean);
}

export function ensureSingleFeaturedVariant(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return variants;
  let featuredIndex = variants.findIndex((v) => v.isFeatured);
  if (featuredIndex < 0) featuredIndex = 0;
  return variants.map((v, i) => ({ ...v, isFeatured: i === featuredIndex }));
}

export function featuredVariant(product) {
  if (!hasColorVariants(product)) return null;
  return product.colorVariants.find((v) => v.isFeatured) ?? product.colorVariants[0] ?? null;
}

export function syncProductImagesFromFeatured(product) {
  const featured = featuredVariant(product);
  if (!featured) return;
  if (featured.image) product.image = featured.image;
  if (Array.isArray(featured.gallery) && featured.gallery.length > 0) {
    product.gallery = featured.gallery;
  }
}

export function syncProductStockFromVariants(product) {
  if (!hasColorVariants(product)) return;
  product.countInStock = product.colorVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
}

export function findVariant(product, variantId) {
  if (!variantId || !hasColorVariants(product)) return null;
  return product.colorVariants.find((v) => String(v._id) === String(variantId)) ?? null;
}

export function variantGalleryImages(variant, product) {
  const primary = variant?.image || product?.image;
  const extras = Array.isArray(variant?.gallery) ? variant.gallery : [];
  const ordered = [primary, ...extras.filter((u) => u && u !== primary)];
  return [...new Set(ordered.filter(Boolean))];
}

export function getStockStatusLabel(stock) {
  const n = Math.max(0, Number(stock) || 0);
  if (n === 0) return "Out of Stock";
  if (n <= 2) return `Only ${n} Left`;
  return "In Stock";
}

export function resolveOrderLineVariant(product, item) {
  if (!hasColorVariants(product)) {
    return {
      variant: null,
      availableStock: product.countInStock,
      colorName: "",
      variantId: undefined
    };
  }

  const variantId = item?.variantId ?? item?.variant;
  const variant = findVariant(product, variantId);
  if (!variant) {
    const err = new Error(`Select a color for ${product.name}`);
    err.statusCode = 400;
    throw err;
  }

  return {
    variant,
    availableStock: variant.stock,
    colorName: variant.colorName,
    variantId: variant._id
  };
}

export async function decrementVariantStock(product, variant, qty, session) {
  const amount = Number(qty) || 0;
  if (amount < 1) return;

  if (variant) {
    variant.stock = Math.max(0, (Number(variant.stock) || 0) - amount);
    syncProductStockFromVariants(product);
  } else {
    product.countInStock = Math.max(0, (Number(product.countInStock) || 0) - amount);
  }

  if (session) {
    await product.save({ session });
  } else {
    await product.save();
  }
}

export async function restoreVariantStock(productId, item, session) {
  const qty = Number(item?.qty) || 0;
  if (!productId || qty < 1) return;

  const query = Product.findById(productId);
  const product = await (session ? query.session(session) : query);
  if (!product) return;

  const variantId = item?.variantId ?? item?.variant;
  if (variantId && hasColorVariants(product)) {
    const variant = findVariant(product, variantId);
    if (variant) {
      variant.stock = (Number(variant.stock) || 0) + qty;
      syncProductStockFromVariants(product);
      if (session) {
        await product.save({ session });
      } else {
        await product.save();
      }
      return;
    }
  }

  product.countInStock = (Number(product.countInStock) || 0) + qty;
  if (session) {
    await product.save({ session });
  } else {
    await product.save();
  }
}
