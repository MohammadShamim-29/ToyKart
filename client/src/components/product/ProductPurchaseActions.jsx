import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ShoppingCart, Zap } from "lucide-react";
import { addToCartAjax, buyNowAjax } from "../../app/addToCartAjax";
import ProductColorSelector from "./ProductColorSelector";

const ProductPurchaseActions = ({
  product,
  inStock,
  variants,
  selectedVariant,
  onVariantSelect,
  needsColor
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [cartMsg, setCartMsg] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const toastTimer = useRef(null);

  const id = product?._id;
  const variantStock = selectedVariant ? Number(selectedVariant.stock) || 0 : Number(product?.countInStock) || 0;
  const maxQty = useMemo(() => Math.max(1, variantStock), [variantStock]);
  const canAdd = inStock && (!needsColor || selectedVariant);

  useEffect(() => {
    setQty(1);
  }, [id, selectedVariant?._id]);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    []
  );

  const addCart = async () => {
    if (!canAdd || !product) return;
    if (isAdding) return;
    const safeQty = Math.min(Math.max(1, qty), maxQty);
    setIsAdding(true);
    try {
      await addToCartAjax({
        dispatch,
        product,
        quantity: safeQty,
        variant: selectedVariant,
        variantId: selectedVariant?._id
      });
      setCartMsg("Added to cart");
      setIsAdded(true);
      window.setTimeout(() => setIsAdded(false), 900);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setCartMsg(""), 2200);
    } catch (err) {
      setCartMsg(err.response?.data?.message || err.message || "Could not add to cart");
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setCartMsg(""), 2600);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!canAdd || !product) return;
    if (isAdding) return;
    const safeQty = Math.min(Math.max(1, qty), maxQty);
    setIsAdding(true);
    try {
      await buyNowAjax({
        dispatch,
        navigate,
        product,
        quantity: safeQty,
        variant: selectedVariant,
        variantId: selectedVariant?._id
      });
    } catch {
      // silent
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="pd-purchase">
      {variants?.length > 0 ? (
        <ProductColorSelector
          variants={variants}
          selectedId={selectedVariant?._id}
          onSelect={onVariantSelect}
          required={needsColor}
        />
      ) : null}

      <div className="pd-qty-row">
        <label className="pd-qty-label" htmlFor="pd-qty">
          Quantity
        </label>
        <input
          id="pd-qty"
          className="pd-qty-input"
          type="number"
          min={1}
          max={maxQty}
          value={qty}
          disabled={!canAdd}
          onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value) || 1)))}
        />
      </div>
      <div className="pd-cta-row">
        <button
          type="button"
          className={clsx("btn btn-primary pd-add-cart", isAdded && "cart-btn-added")}
          disabled={!canAdd || isAdding}
          onClick={addCart}
        >
          <ShoppingCart size={20} />
          {isAdding ? "Adding..." : isAdded ? "Added" : inStock ? "Add to cart" : "Out of stock"}
        </button>
        <button
          type="button"
          className="btn btn-accent pd-buy-now"
          disabled={!canAdd || isAdding}
          onClick={handleBuyNow}
        >
          <Zap size={20} />
          Buy now
        </button>
      </div>
      {needsColor && !selectedVariant ? (
        <p className="pd-color-hint">Select a color to add this item to your cart.</p>
      ) : null}
      {cartMsg ? <p className="pd-cart-toast">{cartMsg}</p> : null}
    </div>
  );
};

export default ProductPurchaseActions;
