import api from "../api";
import { addItem } from "./cartSlice";
import { defaultVariant, hasColorVariants } from "../utils/productVariants";

export const addToCartAjax = async ({
  dispatch,
  product,
  productId,
  quantity = 1,
  variant = null,
  variantId = null
}) => {
  const id = productId || product?._id;
  if (!id) {
    throw new Error("Missing product id");
  }

  const { data: latest } = await api.get(`/products/${id}`);
  let selectedVariant = variant;

  if (hasColorVariants(latest)) {
    const targetId = variantId || variant?._id;
    if (!targetId) {
      selectedVariant = defaultVariant(latest);
      if (!selectedVariant) {
        throw new Error("Please select a color before adding to cart.");
      }
    } else {
      selectedVariant = latest.colorVariants.find((v) => String(v._id) === String(targetId));
    }
    if (!selectedVariant) {
      throw new Error("Selected color is no longer available.");
    }
    if ((Number(selectedVariant.stock) || 0) < 1) {
      throw new Error(`${selectedVariant.colorName} is out of stock.`);
    }
    if ((Number(selectedVariant.stock) || 0) < quantity) {
      throw new Error(`Only ${selectedVariant.stock} left for ${selectedVariant.colorName}.`);
    }
  } else if ((Number(latest?.countInStock) || 0) < 1) {
    throw new Error("This product is currently out of stock.");
  } else if ((Number(latest?.countInStock) || 0) < quantity) {
    throw new Error(`Only ${latest.countInStock} available.`);
  }

  dispatch(addItem({ product: latest, quantity, variant: selectedVariant }));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("toykart:cart-added", {
        detail: { productId: id, variantId: selectedVariant?._id, quantity }
      })
    );
  }
  return latest;
};

/** Add one item and go straight to checkout */
export const buyNowAjax = async ({ dispatch, navigate, product, productId, quantity = 1, variant, variantId }) => {
  await addToCartAjax({ dispatch, product, productId, quantity, variant, variantId });
  navigate("/checkout");
};
