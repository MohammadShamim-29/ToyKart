import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import clsx from "clsx";
import { formatBdt } from "../../utils/formatCurrency";
import { addToCartAjax } from "../../app/addToCartAjax";
import { cardDisplayImage, cardDisplayVariant, productDetailPath } from "../../utils/productVariants";

const ProductQuickViewModal = ({ product, onClose }) => {
  const dispatch = useDispatch();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const addedTimer = useRef(null);
  if (!product) return null;

  const displayVariant = cardDisplayVariant(product);
  const cardImage = cardDisplayImage(product, displayVariant);
  const detailUrl = productDetailPath(product._id, displayVariant);
  const inStock = (product.countInStock ?? 0) > 0;

  const addCart = async () => {
    if (!inStock || isAdding) return;
    setIsAdding(true);
    try {
      await addToCartAjax({
        dispatch,
        product,
        quantity: 1,
        variant: displayVariant,
        variantId: displayVariant?._id
      });
      setIsAdded(true);
      if (addedTimer.current) window.clearTimeout(addedTimer.current);
      addedTimer.current = window.setTimeout(() => setIsAdded(false), 900);
    } catch {
      // Keep modal flow simple; detailed errors are handled on product page.
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="pd-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pd-quick-view-title">
      <div className="pd-modal">
        <button type="button" className="pd-modal-close" onClick={onClose} aria-label="Close quick view">
          <X size={22} />
        </button>
        <div className="pd-modal-grid">
          <div className="pd-modal-media">
            <img src={cardImage} alt={product.name} decoding="async" />
          </div>
          <div className="pd-modal-body">
            <h2 id="pd-quick-view-title" className="pd-modal-title">
              {product.name}
            </h2>
            {displayVariant ? <p className="pd-modal-color">Color: {displayVariant.colorName}</p> : null}
            <p className="pd-modal-price">{formatBdt(product.price)}</p>
            <p className="pd-modal-desc clamp clamp-3">{product.description}</p>
            <div className="pd-modal-actions">
              <button
                type="button"
                className={clsx("btn btn-primary", isAdded && "cart-btn-added")}
                disabled={!inStock || isAdding}
                onClick={addCart}
              >
                {isAdding ? "Adding..." : isAdded ? "Added" : "Add to cart"}
              </button>
              <Link className="btn btn-secondary" to={detailUrl} onClick={onClose}>
                View full details
              </Link>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickViewModal;
