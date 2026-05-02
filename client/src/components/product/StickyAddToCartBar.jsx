import clsx from "clsx";
import { useDispatch } from "react-redux";
import { ShoppingCart } from "lucide-react";
import { formatBdt } from "../../utils/formatCurrency";
import { addItem } from "../../app/cartSlice";

const StickyAddToCartBar = ({ visible, product, inStock }) => {
  const dispatch = useDispatch();
  if (!product) return null;

  const add = () => {
    if (!inStock) return;
    dispatch(addItem({ product, quantity: 1 }));
  };

  return (
    <div className={clsx("pd-sticky-bar", visible && "is-visible")} role="region" aria-label="Product quick purchase">
      <div className="container pd-sticky-inner">
        <div className="pd-sticky-info">
          <span className="pd-sticky-name">{product.name}</span>
          <span className="pd-sticky-price">{formatBdt(product.price)}</span>
        </div>
        <button type="button" className="btn btn-primary" disabled={!inStock} onClick={add}>
          <ShoppingCart size={18} />
          Add to cart
        </button>
      </div>
    </div>
  );
};

export default StickyAddToCartBar;
