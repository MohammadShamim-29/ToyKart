import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "../api";
import { categoryLabel } from "../utils/categoryLabel";
import { formatBdt } from "../utils/formatCurrency";
import {
  getStockStatusLabel,
  hasColorVariants,
  resolveVariantFromParam,
  stockStatusClass,
  variantGalleryImages
} from "../utils/productVariants";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState("");
  const [sticky, setSticky] = useState(false);
  const [displayRating, setDisplayRating] = useState(0);
  const [displayReviewCount, setDisplayReviewCount] = useState(0);
  const summaryRef = useRef(null);

  const needsColor = hasColorVariants(product);
  const variants = product?.colorVariants ?? [];

  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (selectedVariant) return variantGalleryImages(selectedVariant, product);
    const primary = product.image;
    const extras = Array.isArray(product.gallery) ? product.gallery : [];
    const ordered = [primary, ...extras.filter((u) => u && u !== primary)];
    return [...new Set(ordered.filter(Boolean))];
  }, [product, selectedVariant]);

  const variantStock = selectedVariant
    ? Number(selectedVariant.stock) || 0
    : Number(product?.countInStock) || 0;
  const inStock = variantStock > 0;
  const stockLabel = getStockStatusLabel(variantStock);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [{ data: productData }, { data: reviewData }] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/reviews`)
        ]);
        setProduct(productData);
        setDisplayRating(Number(reviewData.rating) || 0);
        setDisplayReviewCount(Number(reviewData.numReviews) || 0);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load product details.");
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const variantParam = searchParams.get("variant") || searchParams.get("color");
    setSelectedVariant(hasColorVariants(product) ? resolveVariantFromParam(product, variantParam) : null);
  }, [product, searchParams]);

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    if (variant?._id) {
      setSearchParams({ variant: String(variant._id) }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

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

  const handleRatingUpdated = useCallback(({ rating, numReviews }) => {
    setDisplayRating(Number(rating) || 0);
    setDisplayReviewCount(Number(numReviews) || 0);
    setProduct((prev) => (prev ? { ...prev, rating, numReviews } : prev));
  }, []);

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

  const reviewCountLabel =
    displayReviewCount === 1 ? "1 review" : `${displayReviewCount} reviews`;

  const compareAt = Number(product.compareAtPrice);
  const showDiscount = Number.isFinite(compareAt) && compareAt > product.price;
  const pctOff = showDiscount ? Math.round(((compareAt - product.price) / compareAt) * 100) : 0;
  const categorySlug = product.category?.slug;
  const categoryLink = categorySlug ? `/?category=${encodeURIComponent(categorySlug)}` : "/";
  const displaySku =
    selectedVariant?.sku?.trim() || product.sku;

  return (
    <div className="pd-page">
      <StickyAddToCartBar
        visible={sticky}
        product={product}
        inStock={inStock}
        selectedVariant={selectedVariant}
        needsColor={needsColor}
      />

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
          <ProductImageGallery
            key={selectedVariant?._id || "default"}
            images={galleryImages}
            alt={`${product.name}${selectedVariant ? ` — ${selectedVariant.colorName}` : ""}`}
          />
        </div>

        <div ref={summaryRef} className="pd-summary card">
          <div className="pd-summary-top">
            <p className="eyebrow">{categoryLabel(product.category)}</p>
            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-rating-row">
              <StarRatingReadOnly value={displayRating} size={17} />
              <span className="pd-rating-num">{displayRating.toFixed(1)}</span>
              <span className="pd-rating-count">({reviewCountLabel})</span>
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

            <p className={`pd-stock ${stockStatusClass(variantStock)}`}>
              <span className="pd-stock-dot" aria-hidden="true" />
              {stockLabel}
              {selectedVariant ? (
                <span className="pd-stock-color"> — {selectedVariant.colorName}</span>
              ) : null}
            </p>
          </div>

          <ProductPurchaseActions
            product={product}
            inStock={inStock}
            variants={variants}
            selectedVariant={selectedVariant}
            onVariantSelect={handleVariantSelect}
            needsColor={needsColor}
          />

          <ProductShareRow url={shareUrl} title={product.name} />

          <div className="pd-meta-block">
            <dl className="pd-meta-dl">
              <div>
                <dt>SKU</dt>
                <dd>{displaySku}</dd>
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
        <ProductDetailTabs product={product} onRatingUpdated={handleRatingUpdated} />
      </div>

      <div className="container">
        <RelatedProducts products={related} />
      </div>
    </div>
  );
};

export default ProductPage;
