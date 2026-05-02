import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import StarRating, { StarRatingReadOnly } from "./StarRating";

const REVIEWS_KEY = "toykart-product-reviews-v1";

const loadAll = () => {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const saveForProduct = (productId, entries) => {
  const all = loadAll();
  all[productId] = entries;
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
};

const tabs = [
  { id: "description", label: "Description" },
  { id: "additional", label: "Additional information" },
  { id: "reviews", label: "Reviews" }
];

const ProductDetailTabs = ({ product }) => {
  const [active, setActive] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formBody, setFormBody] = useState("");

  const productId = product?._id;

  useEffect(() => {
    if (!productId) return;
    const all = loadAll();
    setReviews(Array.isArray(all[productId]) ? all[productId] : []);
  }, [productId]);

  const additionalRows = useMemo(() => {
    if (!product) return [];
    const dims = product.dimensionsCm || {};
    const cert =
      Array.isArray(product.safetyCertifications) && product.safetyCertifications.length > 0
        ? product.safetyCertifications.join(", ")
        : "—";
    return [
      ["Brand", product.brand || "—"],
      ["Age group", product.ageGroup || "—"],
      ["Material", product.material || "—"],
      [
        "Dimensions (cm)",
        [dims.length, dims.width, dims.height].every((n) => Number(n) > 0)
          ? `${dims.length} × ${dims.width} × ${dims.height}`
          : "—"
      ],
      ["Weight", product.weightGrams > 0 ? `${product.weightGrams} g` : "—"],
      ["Country of origin", product.countryOfOrigin || "—"],
      ["Manufacturer", product.manufacturerLocation || "—"],
      ["Safety", cert || "—"],
      ["Subcategory", product.subcategory || "—"]
    ];
  }, [product]);

  const submitReview = useCallback(
    (e) => {
      e.preventDefault();
      if (!productId || !formBody.trim()) return;
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        author: formName.trim() || "Verified buyer",
        rating: formRating,
        body: formBody.trim(),
        createdAt: new Date().toISOString()
      };
      const next = [entry, ...reviews];
      setReviews(next);
      saveForProduct(productId, next);
      setFormBody("");
      setFormName("");
      setFormRating(5);
    },
    [productId, formBody, formName, formRating, reviews]
  );

  if (!product) return null;

  return (
    <div className="pd-tabs-wrap">
      <div className="pd-tabs-bar" role="tablist" aria-label="Product information">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            className={clsx("pd-tab", active === t.id && "is-active")}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pd-tab-panels">
        <section
          id="panel-description"
          role="tabpanel"
          aria-labelledby="tab-description"
          hidden={active !== "description"}
          className="pd-tab-panel"
        >
          <div className="prose-stack">
            <p className="pd-tab-lead">{product.description}</p>
          </div>
        </section>

        <section
          id="panel-additional"
          role="tabpanel"
          aria-labelledby="tab-additional"
          hidden={active !== "additional"}
          className="pd-tab-panel"
        >
          <table className="pd-spec-table">
            <tbody>
              {additionalRows.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section
          id="panel-reviews"
          role="tabpanel"
          aria-labelledby="tab-reviews"
          hidden={active !== "reviews"}
          className="pd-tab-panel"
        >
          <div className="pd-reviews-layout">
            <div className="pd-reviews-summary">
              <h3 className="pd-reviews-heading">Customer reviews</h3>
              <div className="pd-reviews-avg">
                <StarRatingReadOnly value={product.rating} size={20} />
                <span className="pd-reviews-avg-num">{Number(product.rating || 0).toFixed(1)}</span>
                <span className="subtext">
                  {product.numReviews ?? 0} catalog ratings · written notes below stay on this device
                </span>
              </div>
            </div>

            <form className="pd-review-form form" onSubmit={submitReview}>
              <h3 className="pd-review-form-title">Write a review</h3>
              <label className="pd-review-label">
                Your name
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Optional" />
              </label>
              <div className="pd-review-rating-row">
                <span id="review-rating-label" className="pd-review-label-text">
                  Rating
                </span>
                <StarRating value={formRating} onChange={setFormRating} labelId="review-rating-label" />
              </div>
              <label className="pd-review-label">
                Review
                <textarea
                  required
                  rows={4}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Share what you loved or what we could improve."
                />
              </label>
              <button type="submit" className="btn btn-primary">
                Submit review
              </button>
            </form>

            <ul className="pd-review-list">
              {reviews.length === 0 ? (
                <li className="subtext">No written reviews yet. Be the first to share your thoughts.</li>
              ) : (
                reviews.map((r) => (
                  <li key={r.id} className="pd-review-item">
                    <div className="pd-review-item-head">
                      <StarRatingReadOnly value={r.rating} size={14} />
                      <strong>{r.author}</strong>
                      <span className="subtext">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p>{r.body}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetailTabs;
