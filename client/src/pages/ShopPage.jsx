import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api";
import { addToCartAjax } from "../app/addToCartAjax";
import { categoryLabel } from "../utils/categoryLabel";

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0
});

const ShopPage = () => {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState("");
  const [addedId, setAddedId] = useState("");
  const [categories, setCategories] = useState([]);
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("category");
  const keyword = searchParams.get("keyword");

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data } = await api.get("/categories");
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  const activeCategory = categories.find(c => c.slug === categoryId || c._id === categoryId);
  let pageTitle = activeCategory ? `${activeCategory.name} Collection` : "Shop All Collection";
  if (keyword) pageTitle = `Search results for "${keyword}"`;

  useEffect(() => {
    let cancelled = false;

    const fetchItems = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/products", {
          params: { 
            category: categoryId || undefined,
            keyword: keyword || undefined
          }
        });
        if (!cancelled) {
          setItems(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load products right now.");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      cancelled = true;
    };
  }, [categoryId, keyword]);

  return (
    <section className="stack-md" id="shop">
      <div className="section-head">
        <h2>{pageTitle}</h2>
        {!loading && !error && (
          <p className="subtext">
            {items.length} product{items.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {loading && <p className="notice">Loading collection...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="subtext">No products in collection yet.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid cards-grid">
          {items.map((product) => (
            <article className="card product-card product-card-opal" key={product._id}>
              <div className="product-card-opal-media">
                <img src={product.image} alt={product.name} loading="lazy" />
                <span className="product-card-chip">{categoryLabel(product.category)}</span>
                {product.newArrival && (
                  <span className="product-badge-new" style={{ position: 'absolute', top: '0.65rem', right: '0.65rem' }}>New</span>
                )}
              </div>
              <div className="stack-sm product-card-opal-body">
                <p className="subtext">
                  Age {product.ageGroup}
                </p>
                <h3 className="product-card-opal-title">{product.name}</h3>
                <p className="clamp product-card-opal-copy">{product.description}</p>
                <div className="product-meta product-card-opal-meta">
                  <span className="price">{currency.format(product.price)}</span>
                  <span className="stock" style={{ color: product.countInStock ? 'var(--muted)' : 'var(--danger)' }}>
                    {product.countInStock ? `Stock: ${product.countInStock}` : "Out of stock"}
                  </span>
                </div>
                <div className="product-card-opal-foot" style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn btn-primary ${addedId === product._id ? "cart-btn-added" : ""}`}
                    style={{ flex: 1 }}
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
                  <Link className="btn btn-secondary" to={`/product/${product._id}`} style={{ flex: 1 }}>
                    Details
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

export default ShopPage;
