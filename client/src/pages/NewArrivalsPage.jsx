import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { addToCartAjax, buyNowAjax } from "../app/addToCartAjax";
import ProductCard from "../components/ProductCard";

const NewArrivalsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState("");
  const [addedId, setAddedId] = useState("");
  const [buyingId, setBuyingId] = useState("");

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

export default NewArrivalsPage;
