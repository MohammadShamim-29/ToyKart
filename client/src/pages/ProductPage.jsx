import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { categoryLabel } from "../utils/categoryLabel";
import { formatBdt } from "../utils/formatCurrency";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductPurchaseActions from "../components/product/ProductPurchaseActions";
import ProductShareRow from "../components/product/ProductShareRow";
import TrustDeliveryRow from "../components/product/TrustDeliveryRow";
import ProductDetailTabs from "../components/product/ProductDetailTabs";
import RelatedProducts from "../components/product/RelatedProducts";
import StickyAddToCartBar from "../components/product/StickyAddToCartBar";
import { StarRatingReadOnly } from "../components/product/StarRating";

const shortDescription = (text, max = 200) => {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
};

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState("");
  const [sticky, setSticky] = useState(false);
  const summaryRef = useRef(null);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const primary = product.image;
    const extras = Array.isArray(product.gallery) ? product.gallery : [];
    const ordered = [primary, ...extras.filter((u) => u && u !== primary)];
    return [...new Set(ordered.filter(Boolean))];
  }, [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load product details.");
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const { data } = await api.get("/products", {
          params: {
            category: product.category?.slug || undefined,
            sort: "featured",
            limit: 12
          }
        });
        const allProducts = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        if (allProducts.length === 0 || !product) return;
        const catId = product.category?._id?.toString?.() ?? product.category?.toString?.() ?? product.category;
        const same = allProducts.filter((p) => {
          if (p._id === product._id) return false;
          const pCat = p.category?._id ?? p.category;
          return pCat && catId && pCat.toString() === catId.toString();
        });
        const fallback = allProducts.filter((p) => p._id !== product._id);
        const pick = same.length > 0 ? same : fallback;
        setRelated(pick.slice(0, 6));
      } catch {
        setRelated([]);
      }
    };
    if (product) fetchRelated();
  }, [product]);

  useEffect(() => {
    const el = summaryRef.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setSticky(!entry.isIntersecting);
      },
      { rootMargin: "-72px 0px 0px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [product]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  if (error) {
    return (
      <section className="stack-md container">
        <p className="error">{error}</p>
        <Link className="btn btn-secondary" to="/">
          Back to Home
        </Link>
      </section>
    );
  }

  if (!product) {
    return (
      <p className="notice container">
        Loading product...
      </p>
    );
  }

  const inStock = (product.countInStock || 0) > 0;
  const compareAt = Number(product.compareAtPrice);
  const showDiscount = Number.isFinite(compareAt) && compareAt > product.price;
  const pctOff = showDiscount ? Math.round(((compareAt - product.price) / compareAt) * 100) : 0;
  const categorySlug = product.category?.slug;
  const categoryLink = categorySlug ? `/?category=${encodeURIComponent(categorySlug)}` : "/";

  return (
    <div className="pd-page">
      <StickyAddToCartBar visible={sticky} product={product} inStock={inStock} />

      <div className="container pd-header">
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to={categoryLink}>{categoryLabel(product.category) || "Shop"}</Link>
          <span aria-hidden="true">/</span>
          <span className="pd-breadcrumb-current">{product.name}</span>
        </nav>
      </div>

      <div className="container pd-grid">
        <div className="pd-media-card card">
          <ProductImageGallery images={galleryImages} alt={product.name} />
        </div>

        <div ref={summaryRef} className="pd-summary card">
          <div className="pd-summary-top">
            <p className="eyebrow">{categoryLabel(product.category)}</p>
            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-rating-row">
              <StarRatingReadOnly value={product.rating} size={17} />
              <span className="pd-rating-num">{Number(product.rating || 0).toFixed(1)}</span>
              <span className="pd-rating-count">({product.numReviews ?? 0} reviews)</span>
            </div>

            <div className="pd-price-block">
              {showDiscount ? (
                <>
                  <span className="pd-price-current">{formatBdt(product.price)}</span>
                  <span className="pd-price-was">{formatBdt(compareAt)}</span>
                  <span className="pd-price-badge">-{pctOff}%</span>
                </>
              ) : (
                <span className="pd-price-current">{formatBdt(product.price)}</span>
              )}
            </div>

            <p className="pd-short-desc">{shortDescription(product.description)}</p>

            <p className={inStock ? "pd-stock pd-stock--ok" : "pd-stock pd-stock--bad"}>
              <span className="pd-stock-dot" aria-hidden="true" />
              {inStock ? `In stock (${product.countInStock} available)` : "Out of stock"}
            </p>
          </div>

          <ProductPurchaseActions product={product} inStock={inStock} />

          <ProductShareRow url={shareUrl} title={product.name} />

          <div className="pd-meta-block">
            <dl className="pd-meta-dl">
              <div>
                <dt>SKU</dt>
                <dd>{product.sku}</dd>
              </div>
              <div>
                <dt>Categories</dt>
                <dd>
                  <Link to={categoryLink}>{categoryLabel(product.category)}</Link>
                </dd>
              </div>
              {Array.isArray(product.tags) && product.tags.length > 0 ? (
                <div className="pd-meta-tags-wrap">
                  <dt>Tags</dt>
                  <dd>
                    <div className="chip-row">
                      {product.tags.map((tag) => (
                        <span className="chip" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              ) : (
                <div>
                  <dt>Tags</dt>
                  <dd className="subtext">—</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      <div className="container pd-trust-section">
        <TrustDeliveryRow />
      </div>

      <div className="container pd-tabs-section">
        <ProductDetailTabs product={product} />
      </div>

      <div className="container">
        <RelatedProducts products={related} />
      </div>
    </div>
  );
};

export default ProductPage;
