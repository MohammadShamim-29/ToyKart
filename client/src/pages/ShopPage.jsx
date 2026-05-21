import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api";
import { addToCartAjax, buyNowAjax } from "../app/addToCartAjax";
import ProductCard from "../components/ProductCard";

const ShopPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState("");
  const [addedId, setAddedId] = useState("");
  const [buyingId, setBuyingId] = useState("");
  const [categories, setCategories] = useState([]);
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("category");
  const keyword = searchParams.get("keyword");

  const handleAddToCart = async (product, variant) => {
    setAddingId(product._id);
    try {
      await addToCartAjax({
        dispatch,
        product,
        quantity: 1,
        variant,
        variantId: variant?._id
      });
      setAddedId(product._id);
      window.setTimeout(() => {
        setAddedId((prev) => (prev === product._id ? "" : prev));
      }, 900);
    } catch {
      // keep card quiet on failure
    } finally {
      setAddingId((prev) => (prev === product._id ? "" : prev));
    }
  };

  const handleBuyNow = async (product, variant) => {
    setBuyingId(product._id);
    try {
      await buyNowAjax({ dispatch, navigate, product, quantity: 1, variant, variantId: variant?._id });
    } catch {
      // keep card quiet on failure
    } finally {
      setBuyingId((prev) => (prev === product._id ? "" : prev));
    }
  };

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
            <ProductCard
              key={product._id}
              product={product}
              addingId={addingId}
              addedId={addedId}
              buyingId={buyingId}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              showStock
              showAgeLine
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ShopPage;
