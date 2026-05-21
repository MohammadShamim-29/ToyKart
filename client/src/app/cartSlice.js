import { createSlice } from "@reduxjs/toolkit";
import { readCartItems } from "../utils/cartStorage";
import { cartLineKey } from "../utils/productVariants";

const clampQty = (qty, maxStock) => {
  const q = Math.max(1, Number(qty) || 1);
  if (!Number.isFinite(maxStock) || maxStock < 1) return q;
  return Math.min(q, maxStock);
};

const buildLineFromProduct = (product, quantity, variant) => {
  const hasVariant = Boolean(variant?._id);
  const maxStock = hasVariant
    ? Math.max(0, Number(variant.stock) || 0)
    : Math.max(0, product.countInStock ?? 0);
  if (maxStock < 1) return null;
  const qty = clampQty(quantity, maxStock);
  return {
    productId: product._id,
    variantId: hasVariant ? String(variant._id) : "",
    colorName: hasVariant ? variant.colorName : "",
    name: product.name,
    image: hasVariant ? variant.image || product.image : product.image,
    price: product.price,
    qty,
    countInStock: maxStock,
    sku: hasVariant && variant.sku ? variant.sku : product.sku ?? ""
  };
};

const lineKey = (line) => cartLineKey(line.productId, line.variantId);

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: readCartItems() },
  reducers: {
    addItem: (state, { payload }) => {
      const product = payload?.product;
      const quantity = payload?.quantity ?? 1;
      const variant = payload?.variant ?? null;
      if (!product?._id) return;
      const line = buildLineFromProduct(product, quantity, variant);
      if (!line) return;
      const key = lineKey(line);
      const idx = state.items.findIndex((l) => lineKey(l) === key);
      if (idx >= 0) {
        const maxStock = line.countInStock;
        const merged = state.items[idx].qty + line.qty;
        state.items[idx] = {
          ...state.items[idx],
          ...line,
          qty: clampQty(merged, maxStock)
        };
      } else {
        state.items.push(line);
      }
    },
    setLineQty: (state, { payload }) => {
      const { productId, variantId = "", qty } = payload || {};
      if (!productId) return;
      const key = cartLineKey(productId, variantId);
      const idx = state.items.findIndex((l) => lineKey(l) === key);
      if (idx < 0) return;
      const max = state.items[idx].countInStock;
      state.items[idx].qty = clampQty(Number(qty) || 1, max);
    },
    removeLine: (state, { payload }) => {
      const { productId, variantId = "" } =
        typeof payload === "object" && payload !== null
          ? payload
          : { productId: payload, variantId: "" };
      if (!productId) return;
      const key = cartLineKey(productId, variantId);
      state.items = state.items.filter((l) => lineKey(l) !== key);
    },
    clearCart: (state) => {
      state.items = [];
    },
    hydrateFromStorage: (state) => {
      state.items = readCartItems();
    }
  }
});

export const { addItem, setLineQty, removeLine, clearCart, hydrateFromStorage } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;

export const selectCartItemCount = (state) =>
  state.cart.items.reduce((n, line) => n + (Number(line.qty) || 0), 0);

export default cartSlice.reducer;
