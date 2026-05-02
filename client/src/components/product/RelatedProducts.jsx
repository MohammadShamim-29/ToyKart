import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, ShoppingCart } from "lucide-react";
import { formatBdt } from "../../utils/formatCurrency";
import { categoryLabel } from "../../utils/categoryLabel";
import ProductQuickViewModal from "./ProductQuickViewModal";
import { useDispatch } from "react-redux";
import { addToCartAjax } from "../../app/addToCartAjax";

const RelatedProducts = ({ products }) => {
  const dispatch = useDispatch();
  const [quick, setQuick] = useState(null);
  const [addingId, setAddingId] = useState("");
  const [addedId, setAddedId] = useState("");

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
                <div className="pd-related-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn btn-primary ${addedId === p._id ? "cart-btn-added" : ""}`}
                      style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}
                      disabled={!p.countInStock || addingId === p._id}
                      onClick={async () => {
                        setAddingId(p._id);
                        try {
                          await addToCartAjax({ dispatch, product: p, quantity: 1 });
                          setAddedId(p._id);
                          window.setTimeout(() => {
                            setAddedId((prev) => (prev === p._id ? "" : prev));
                          }, 900);
                        } catch {
                          // silent fail
                        } finally {
                          setAddingId("");
                        }
                      }}
                    >
                      {addingId === p._id ? "..." : addedId === p._id ? "Added" : "Add to cart"}
                    </button>
                    <Link className="btn btn-secondary" to={`/product/${p._id}`} style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}>
                      Details
                    </Link>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost pd-quick-view-btn"
                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                    onClick={() => setQuick(p)}
                    aria-label={`Quick view ${p.name}`}
                  >
                    <Eye size={16} /> Quick view
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
