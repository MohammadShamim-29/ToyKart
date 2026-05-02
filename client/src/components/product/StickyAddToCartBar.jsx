import clsx from "clsx";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { ShoppingCart } from "lucide-react";
import { formatBdt } from "../../utils/formatCurrency";
import { addToCartAjax } from "../../app/addToCartAjax";

const StickyAddToCartBar = ({ visible, product, inStock }) => {
  const dispatch = useDispatch();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const addedTimer = useRef(null);
  if (!product) return null;

  const add = async () => {
    if (!inStock || isAdding) return;
    setIsAdding(true);
    try {
      await addToCartAjax({ dispatch, product, quantity: 1 });
      setIsAdded(true);
      if (addedTimer.current) window.clearTimeout(addedTimer.current);
      addedTimer.current = window.setTimeout(() => setIsAdded(false), 900);
    } catch {
      // Silent fallback to keep sticky CTA non-blocking.
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={clsx("pd-sticky-bar", visible && "is-visible")} role="region" aria-label="Product quick purchase">
      <div className="container pd-sticky-inner">
        <div className="pd-sticky-info">
          <span className="pd-sticky-name">{product.name}</span>
          <span className="pd-sticky-price">{formatBdt(product.price)}</span>
        </div>
        <button
          type="button"
          className={clsx("btn btn-primary", isAdded && "cart-btn-added")}
          disabled={!inStock || isAdding}
          onClick={add}
        >
          <ShoppingCart size={18} />
          {isAdding ? "Adding..." : isAdded ? "Added" : "Add to cart"}
        </button>
      </div>
    </div>
  );
};

export default StickyAddToCartBar;
