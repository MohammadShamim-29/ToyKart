import api from "../api";
import { addItem } from "./cartSlice";

export const addToCartAjax = async ({ dispatch, product, productId, quantity = 1 }) => {
  const id = productId || product?._id;
  if (!id) {
    throw new Error("Missing product id");
  }

  const { data } = await api.get(`/products/${id}`);
  const latest = data;
  const inStock = Number(latest?.countInStock ?? 0);

  if (inStock < 1) {
    throw new Error("This product is currently out of stock.");
  }

  dispatch(addItem({ product: latest, quantity }));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("toykart:cart-added", {
        detail: { productId: id, quantity }
      })
    );
  }
  return latest;
};
