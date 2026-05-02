import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { formatBdt } from "../../utils/formatCurrency";
import { categoryLabel } from "../../utils/categoryLabel";
import ProductQuickViewModal from "./ProductQuickViewModal";

const RelatedProducts = ({ products }) => {
  const [quick, setQuick] = useState(null);

  if (!products?.length) return null;

  return (
    <>
      <section className="pd-related" aria-labelledby="pd-related-title">
        <div className="section-head">
          <h2 id="pd-related-title">Related products</h2>
          <p className="subtext">Customers who viewed this item also explored these picks.</p>
        </div>
        <div className="pd-related-grid">
          {products.map((p) => (
            <article key={p._id} className="pd-related-card">
              <Link to={`/product/${p._id}`} className="pd-related-media">
                <img src={p.image} alt={p.name} decoding="async" loading="lazy" />
              </Link>
              <div className="pd-related-body">
                <p className="pd-related-cat">{categoryLabel(p.category)}</p>
                <Link to={`/product/${p._id}`} className="pd-related-name">
                  {p.name}
                </Link>
                <p className="pd-related-price">{formatBdt(p.price)}</p>
                <div className="pd-related-actions">
                  <Link className="btn btn-primary pd-related-view" to={`/product/${p._id}`}>
                    View product
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary pd-quick-view-btn"
                    onClick={() => setQuick(p)}
                    aria-label={`Quick view ${p.name}`}
                  >
                    <Eye size={18} />
                    Quick view
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      {quick ? <ProductQuickViewModal product={quick} onClose={() => setQuick(null)} /> : null}
    </>
  );
};

export default RelatedProducts;
