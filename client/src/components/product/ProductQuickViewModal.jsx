import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { formatBdt } from "../../utils/formatCurrency";
import { addItem } from "../../app/cartSlice";

const ProductQuickViewModal = ({ product, onClose }) => {
  const dispatch = useDispatch();
  if (!product) return null;

  const inStock = (product.countInStock ?? 0) > 0;

  const addCart = () => {
    if (!inStock) return;
    dispatch(addItem({ product, quantity: 1 }));
  };

  return (
    <div className="pd-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pd-quick-view-title">
      <div className="pd-modal">
        <button type="button" className="pd-modal-close" onClick={onClose} aria-label="Close quick view">
          <X size={22} />
        </button>
        <div className="pd-modal-grid">
          <div className="pd-modal-media">
            <img src={product.image} alt={product.name} decoding="async" />
          </div>
          <div className="pd-modal-body">
            <h2 id="pd-quick-view-title" className="pd-modal-title">
              {product.name}
            </h2>
            <p className="pd-modal-price">{formatBdt(product.price)}</p>
            <p className="pd-modal-desc clamp clamp-3">{product.description}</p>
            <div className="pd-modal-actions">
              <button type="button" className="btn btn-primary" disabled={!inStock} onClick={addCart}>
                Add to cart
              </button>
              <Link className="btn btn-secondary" to={`/product/${product._id}`} onClick={onClose}>
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
