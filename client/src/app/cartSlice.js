import { createSlice } from "@reduxjs/toolkit";
import { readCartItems } from "../utils/cartStorage";

const clampQty = (qty, maxStock) => {
  const q = Math.max(1, Number(qty) || 1);
  if (!Number.isFinite(maxStock) || maxStock < 1) return q;
  return Math.min(q, maxStock);
};

const buildLineFromProduct = (product, quantity) => {
  const maxStock = Math.max(0, product.countInStock ?? 0);
  if (maxStock < 1) return null;
  const qty = clampQty(quantity, maxStock);
  return {
    productId: product._id,
    name: product.name,
    image: product.image,
    price: product.price,
    qty,
    countInStock: maxStock,
    sku: product.sku ?? ""
  };
};

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: readCartItems() },
  reducers: {
    addItem: (state, { payload }) => {
      const product = payload?.product;
      const quantity = payload?.quantity ?? 1;
      if (!product?._id) return;
      const line = buildLineFromProduct(product, quantity);
      if (!line) return;
      const idx = state.items.findIndex((l) => l.productId === product._id);
      if (idx >= 0) {
        const maxStock = line.countInStock;
        const merged = state.items[idx].qty + line.qty;
        state.items[idx] = {
          ...state.items[idx],
          qty: clampQty(merged, maxStock),
          price: product.price,
          name: product.name,
          image: product.image,
          countInStock: maxStock,
          sku: product.sku ?? ""
        };
      } else {
        state.items.push(line);
      }
    },
    setLineQty: (state, { payload }) => {
      const { productId, qty } = payload || {};
      if (!productId) return;
      const idx = state.items.findIndex((l) => l.productId === productId);
      if (idx < 0) return;
      const max = state.items[idx].countInStock;
      state.items[idx].qty = clampQty(Number(qty) || 1, max);
    },
    removeLine: (state, { payload: productId }) => {
      if (!productId) return;
      state.items = state.items.filter((l) => l.productId !== productId);
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
