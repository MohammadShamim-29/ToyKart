import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api";
import { addToCartAjax } from "../app/addToCartAjax";
import { categoryLabel } from "../utils/categoryLabel";

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0
});

const NewArrivalsPage = () => {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState("");
  const [addedId, setAddedId] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchNewArrivals = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/products", {
          params: {
            newArrival: true,
            sort: "newest",
            page: 1,
            limit: 24
          }
        });

        if (!cancelled) {
          setItems(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load new arrivals right now.");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchNewArrivals();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="stack-md" id="new-arrivals">
      <div className="section-head">
        <h2>New Arrivals</h2>
        {!loading && !error && (
          <p className="subtext">
            {items.length} product{items.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {loading && <p className="notice">Loading new arrivals...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="subtext">No products are marked as new arrivals yet.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid cards-grid">
          {items.map((product) => (
            <article className="card product-card" key={product._id}>
              <div className="product-card-image-wrap">
                <img src={product.image} alt={product.name} loading="lazy" />
                {product.newArrival && <span className="product-badge-new">New</span>}
              </div>
              <div className="stack-sm">
                <p className="subtext">
                  {categoryLabel(product.category)} • Age {product.ageGroup}
                </p>
                <h3>{product.name}</h3>
                <p className="clamp">{product.description}</p>
                <div className="product-meta">
                  <span className="price">{currency.format(product.price)}</span>
                  <span className="stock">Stock: {product.countInStock}</span>
                </div>
                <div className="product-card-actions">
                  <button
                    type="button"
                    className={`btn btn-primary ${addedId === product._id ? "cart-btn-added" : ""}`}
                    disabled={!product.countInStock || addingId === product._id}
                    onClick={async () => {
                      setAddingId(product._id);
                      try {
                        await addToCartAjax({ dispatch, product, quantity: 1 });
                        setAddedId(product._id);
                        window.setTimeout(() => {
                          setAddedId((prev) => (prev === product._id ? "" : prev));
                        }, 900);
                      } catch {
                        // keep card quiet on failure
                      } finally {
                        setAddingId((prev) => (prev === product._id ? "" : prev));
                      }
                    }}
                  >
                    {addingId === product._id ? "Adding..." : addedId === product._id ? "Added" : "Add to cart"}
                  </button>
                  <Link className="btn btn-secondary" to={`/product/${product._id}`}>
                    View Details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default NewArrivalsPage;
