import { Link } from "react-router-dom";
import { categoryLabel } from "../utils/categoryLabel";
import {
  cardDisplayImage,
  cardDisplayVariant,
  hasColorVariants,
  productDetailPath
} from "../utils/productVariants";

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0
});

const ProductCard = ({
  product,
  addingId,
  addedId,
  buyingId,
  onAddToCart,
  onBuyNow,
  showStock = false,
  showAgeLine = false
}) => {
  const displayVariant = cardDisplayVariant(product);
  const cardImage = cardDisplayImage(product, displayVariant);
  const productUrl = productDetailPath(product._id, displayVariant);
  const variantCount = hasColorVariants(product) ? product.colorVariants.length : 0;
  const busy = addingId === product._id || buyingId === product._id;
  const outOfStock = !product.countInStock;

  return (
    <article className="card product-card product-card-opal product-card--clickable">
      <Link to={productUrl} className="product-card-hit" aria-label={`View ${product.name}`} />
      <div className="product-card-opal-media">
        <img src={cardImage} alt={product.name} loading="lazy" />
        <span className="product-card-chip">{categoryLabel(product.category)}</span>
        {displayVariant ? (
          <span className="product-card-color" title={displayVariant.colorName}>
            <span
              className="product-card-color-dot"
              style={{ backgroundColor: displayVariant.colorCode || "#ccc" }}
              aria-hidden="true"
            />
            <span className="product-card-color-name">{displayVariant.colorName}</span>
            {variantCount > 1 ? (
              <span className="product-card-color-more">+{variantCount - 1}</span>
            ) : null}
          </span>
        ) : null}
        {product.newArrival && (
          <span className="product-badge-new" style={{ position: "absolute", top: "0.65rem", right: "0.65rem" }}>
            New
          </span>
        )}
      </div>
      <div className="stack-sm product-card-opal-body">
        {showAgeLine && <p className="subtext">Age {product.ageGroup}</p>}
        <h3 className="product-card-opal-title">{product.name}</h3>
        <p className="clamp product-card-opal-copy">{product.description}</p>
        <div className="product-meta product-card-opal-meta">
          <span className="price">{currency.format(product.price)}</span>
          {showStock ? (
            <span className="stock" style={{ color: product.countInStock ? "var(--muted)" : "var(--danger)" }}>
              {product.countInStock ? `Stock: ${product.countInStock}` : "Out of stock"}
            </span>
          ) : (
            <span className="stock">Age {product.ageGroup}</span>
          )}
        </div>
        <div className="product-card-opal-foot product-card-opal-actions" style={{ marginTop: "0.5rem" }}>
          <button
            type="button"
            className={`btn btn-secondary ${addedId === product._id ? "cart-btn-added" : ""}`}
            disabled={outOfStock || busy}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(product, displayVariant);
            }}
          >
            {addingId === product._id ? "Adding..." : addedId === product._id ? "Added" : "Add to cart"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={outOfStock || busy}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBuyNow?.(product, displayVariant);
            }}
          >
            {buyingId === product._id ? "..." : "Buy now"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
