import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Filter, ShieldCheck, Sparkles, Star, Truck, X } from "lucide-react";
import api from "../api";
import { useDispatch, useSelector } from "react-redux";
import { addToCartAjax, buyNowAjax } from "../app/addToCartAjax";
import ProductCard from "../components/ProductCard";

const heroSlides = [
  {
    title: "Play, Recrafted in Jewel Tones",
    subtitle: "A high-design storefront for curated family living in Bangladesh.",
    image:
      "https://images.unsplash.com/photo-1759680190851-199358b2cd8c?auto=format&fit=crop&w=1800&q=80",
    sourceLabel: "Unsplash",
    sourceUrl:
      "https://unsplash.com/photos/a-colorful-collection-of-small-plastic-toys-wh4psDv-NW8"
  },
  {
    title: "Statement Pieces for Everyday Wonder",
    subtitle: "Refined toys, bold palettes, and tactile finishes that feel collectible.",
    image:
      "https://images.pexels.com/photos/18990727/pexels-photo-18990727.jpeg?cs=srgb&fm=jpg&w=1800",
    sourceLabel: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/adorable-kid-playing-with-constructor-set-at-home-18990727/"
  },
  {
    title: "Modern Heritage for New Homes",
    subtitle: "Designed for gifting, celebrating, and creating unforgettable play rituals.",
    image: "https://cdn.pixabay.com/photo/2020/03/20/06/40/baby-4949751_1280.jpg",
    sourceLabel: "Pixabay",
    sourceUrl: "https://pixabay.com/photos/baby-plays-toys-childrens-room-4949751/"
  }
];

const lifestyleGallery = [
  {
    image:
      "https://images.unsplash.com/photo-1685358259043-a367462adf15?auto=format&fit=crop&w=1200&q=80",
    title: "Deep Color Stories",
    text: "Collections built around rich tones and premium textures.",
    source: "Unsplash"
  },
  {
    image:
      "https://images.pexels.com/photos/31152757/pexels-photo-31152757.jpeg?cs=srgb&fm=jpg&w=1200",
    title: "Editorial Display",
    text: "Toys that look beautiful on shelves even after playtime.",
    source: "Pexels"
  },
  {
    image: "https://cdn.pixabay.com/photo/2018/09/09/13/26/toys-3664574_640.jpg",
    title: "Gift-Ready Curation",
    text: "Beautifully chosen picks for birthdays and special occasions.",
    source: "Pixabay"
  }
];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [addingId, setAddingId] = useState("");
  const [addedId, setAddedId] = useState("");
  const [buyingId, setBuyingId] = useState("");
  const [categories, setCategories] = useState([]);

  const defaultFilters = useMemo(
    () => ({
      ageGroup: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "featured",
      newArrival: false
    }),
    []
  );

  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          limit: 48,
          sort: appliedFilters.sort || "featured"
        };
        if (appliedFilters.ageGroup) params.ageGroup = appliedFilters.ageGroup;
        if (appliedFilters.category) params.category = appliedFilters.category;
        if (appliedFilters.minPrice !== "") params.minPrice = appliedFilters.minPrice;
        if (appliedFilters.maxPrice !== "") params.maxPrice = appliedFilters.maxPrice;
        if (appliedFilters.newArrival) params.newArrival = 1;

        const { data } = await api.get("/products", { params });
        const list = Array.isArray(data) ? data : data?.items;
        const items = Array.isArray(list) ? list : [];
        setProducts(items);
        setCatalogTotal(Number.isFinite(Number(data?.total)) ? Number(data.total) : items.length);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load products right now.");
        setProducts([]);
        setCatalogTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [appliedFilters]);

  useEffect(() => {
    api
      .get("/categories")
      .then(({ data }) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const featuredProducts = useMemo(() => {
    const featured = products.filter((product) => product.isFeatured);
    const pick = featured.length > 0 ? featured : products;
    return pick.slice(0, 6);
  }, [products]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

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

  const currentSlide = heroSlides[activeSlide];

  return (
    <div className="home-clean stack-lg">
      <section className="hero-opal">
        <AnimatePresence mode="wait">
          <motion.article
            key={currentSlide.image}
            className="hero-opal-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
          >
            <div className="hero-opal-media">
              <img src={currentSlide.image} alt={currentSlide.title} className="hero-slide-image" />
              <div className="hero-slide-overlay" />
            </div>
            <div className="hero-opal-content">
              <p className="eyebrow">ToyKart Signature</p>
              <h1 className="hero-opal-title">{currentSlide.title}</h1>
              <p className="hero-opal-copy">{currentSlide.subtitle}</p>
              <div className="hero-actions hero-actions-opal">
                {userInfo ? (
                  <Link className="btn btn-primary" to="/shop">
                    Shop Collection <ArrowRight size={15} />
                  </Link>
                ) : (
                  <>
                    <Link className="btn btn-primary" to="/login">
                      Login to Shop <ArrowRight size={15} />
                    </Link>
                    <Link className="btn btn-secondary" to="/register">
                      Register Now
                    </Link>
                  </>
                )}
              </div>
              <ul className="hero-opal-points">
                <li>Premium picks across Bangladesh</li>
                <li>Cash on delivery and secure checkout</li>
                <li>Curated arrivals weekly</li>
              </ul>
            </div>
          </motion.article>
        </AnimatePresence>

        <div className="hero-dots" role="tablist" aria-label="Hero Slides">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              className={`dot ${index === activeSlide ? "is-active" : ""}`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
        <a href={currentSlide.sourceUrl} target="_blank" rel="noreferrer" className="hero-credit">
          Photo source: {currentSlide.sourceLabel}
        </a>
      </section>

      <section className="trust-row trust-row-opal">
        <article className="trust-card card">
          <ShieldCheck size={18} />
          <div>
            <h3>Child-Safe Standards</h3>
            <p>Every item is screened for safety, finish quality, and durability.</p>
          </div>
        </article>
        <article className="trust-card card">
          <Truck size={18} />
          <div>
            <h3>Concierge Delivery</h3>
            <p>Reliable delivery across Bangladesh with careful packaging.</p>
          </div>
        </article>
        <article className="trust-card card">
          <Sparkles size={18} />
          <div>
            <h3>Curated Aesthetics</h3>
            <p>Minimal silhouettes and refined tones inspired by luxury retail.</p>
          </div>
        </article>
      </section>

      <section className="gallery-clean gallery-opal">
        {lifestyleGallery.map((item) => (
          <article className="gallery-item card" key={item.title}>
            <img src={item.image} alt={item.title} />
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span>{item.source}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="stack-md catalog-opal" id="catalog">
        <div className="section-head">
          <h2>Signature Collection</h2>
          {!loading && !error && <p className="subtext">{catalogTotal} products in catalog</p>}
        </div>

        <form className="catalog-filters" onSubmit={handleApplyFilters}>
          <label className="catalog-filter">
            Age
            <select
              value={filters.ageGroup}
              onChange={(e) => setFilters((prev) => ({ ...prev, ageGroup: e.target.value }))}
            >
              <option value="">All</option>
              <option value="0-2">0-2</option>
              <option value="3-5">3-5</option>
              <option value="6-8">6-8</option>
              <option value="9-12">9-12</option>
              <option value="13+">13+</option>
            </select>
          </label>

          <label className="catalog-filter">
            Category
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              disabled={categories.length === 0}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="catalog-filter">
            Min price
            <input
              inputMode="numeric"
              value={filters.minPrice}
              onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
              placeholder="0"
            />
          </label>

          <label className="catalog-filter">
            Max price
            <input
              inputMode="numeric"
              value={filters.maxPrice}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
              placeholder="5000"
            />
          </label>

          <label className="catalog-filter catalog-filter--check">
            <input
              type="checkbox"
              checked={filters.newArrival}
              onChange={(e) => setFilters((prev) => ({ ...prev, newArrival: e.target.checked }))}
            />
            New arrivals
          </label>

          <label className="catalog-filter">
            Sort
            <select value={filters.sort} onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Top Rated</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
            </select>
          </label>

          <div className="catalog-filter-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Filter size={16} /> Apply
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleResetFilters} disabled={loading}>
              <X size={16} /> Reset
            </button>
          </div>
        </form>

        {loading && <p className="notice">Loading products...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && featuredProducts.length === 0 && (
          <p className="notice">
            No products in the catalog yet. Add products in the admin panel (status must be Active), or run{" "}
            <code>npm run seed --workspace server</code> to load sample data.
          </p>
        )}

        {!loading && !error && featuredProducts.length > 0 && (
          <div className="grid cards-grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                addingId={addingId}
                addedId={addedId}
                buyingId={buyingId}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
