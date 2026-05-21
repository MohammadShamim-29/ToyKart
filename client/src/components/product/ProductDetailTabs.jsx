import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import clsx from "clsx";
import api from "../../api";
import StarRating, { StarRatingReadOnly } from "./StarRating";

const tabs = [
  { id: "description", label: "Description" },
  { id: "additional", label: "Additional information" },
  { id: "reviews", label: "Reviews" }
];

const reviewCountLabel = (n) => {
  const count = Number(n) || 0;
  return count === 1 ? "1 review" : `${count} reviews`;
};

const ProductDetailTabs = ({ product, onRatingUpdated }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [active, setActive] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [summaryRating, setSummaryRating] = useState(0);
  const [summaryCount, setSummaryCount] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formBody, setFormBody] = useState("");

  const productId = product?._id;
  const onRatingUpdatedRef = useRef(onRatingUpdated);
  useEffect(() => {
    onRatingUpdatedRef.current = onRatingUpdated;
  }, [onRatingUpdated]);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoadingReviews(true);
    try {
      const { data } = await api.get(`/products/${productId}/reviews`);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      const rating = Number(data.rating) || 0;
      const numReviews = Number(data.numReviews) || 0;
      setSummaryRating(rating);
      setSummaryCount(numReviews);
      onRatingUpdatedRef.current?.({ rating, numReviews });
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    setSummaryRating(Number(product.rating) || 0);
    setSummaryCount(Number(product.numReviews) || 0);
    fetchReviews();
  }, [productId, fetchReviews]);

  useEffect(() => {
    if (userInfo?.name) {
      setFormName(userInfo.name);
    }
  }, [userInfo?.name]);

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

  const submitReview = async (e) => {
    e.preventDefault();
    if (!productId || !formBody.trim()) return;
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");
    try {
      const { data } = await api.post(`/products/${productId}/reviews`, {
        rating: formRating,
        body: formBody.trim(),
        authorName: formName.trim() || undefined
      });
      setReviews((prev) => [data.review, ...prev]);
      setSummaryRating(Number(data.rating) || 0);
      setSummaryCount(Number(data.numReviews) || 0);
      onRatingUpdated?.({ rating: data.rating, numReviews: data.numReviews });
      setFormBody("");
      if (!userInfo?.name) setFormName("");
      setFormRating(5);
      setFormSuccess("Thank you! Your review was published.");
      window.setTimeout(() => setFormSuccess(""), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not submit your review. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
            {t.id === "reviews" && summaryCount > 0 ? ` (${summaryCount})` : ""}
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
                <StarRatingReadOnly value={summaryRating} size={20} />
                <span className="pd-reviews-avg-num">{summaryRating.toFixed(1)}</span>
                <span className="subtext">{reviewCountLabel(summaryCount)}</span>
              </div>
            </div>

            <form className="pd-review-form form" onSubmit={submitReview}>
              <h3 className="pd-review-form-title">Write a review</h3>
              {!userInfo ? (
                <label className="pd-review-label">
                  Your name
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Required if not signed in"
                    required
                  />
                </label>
              ) : (
                <p className="subtext">Posting as {userInfo.name}</p>
              )}
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
                  minLength={10}
                  rows={4}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Share what you loved or what we could improve (min. 10 characters)."
                />
              </label>
              {formError ? <p className="error">{formError}</p> : null}
              {formSuccess ? <p className="notice">{formSuccess}</p> : null}
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit review"}
              </button>
            </form>

            {loadingReviews ? (
              <p className="subtext">Loading reviews...</p>
            ) : (
              <ul className="pd-review-list">
                {reviews.length === 0 ? (
                  <li className="subtext">No reviews yet. Be the first to share your thoughts.</li>
                ) : (
                  reviews.map((r) => (
                    <li key={r._id} className="pd-review-item">
                      <div className="pd-review-item-head">
                        <StarRatingReadOnly value={r.rating} size={14} />
                        <strong>{r.authorName}</strong>
                        <span className="subtext">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p>{r.body}</p>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetailTabs;
