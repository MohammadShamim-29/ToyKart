import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import api from "../api";
import { categoryLabel } from "../utils/categoryLabel";
import { useDispatch, useSelector } from "react-redux";
import { addToCartAjax } from "../app/addToCartAjax";

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0
});

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [addingId, setAddingId] = useState("");
  const [addedId, setAddedId] = useState("");
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get("/products");
        const list = Array.isArray(data) ? data : data?.items;
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load products right now.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
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
          {!loading && !error && <p className="subtext">{products.length} products in catalog</p>}
        </div>

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
              <article className="card product-card product-card-opal" key={product._id}>
                <div className="product-card-opal-media">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span className="product-card-chip">{categoryLabel(product.category)}</span>
                </div>
                <div className="stack-sm product-card-opal-body">
                  <h3 className="product-card-opal-title">{product.name}</h3>
                  <p className="clamp product-card-opal-copy">{product.description}</p>
                  <div className="product-meta product-card-opal-meta">
                    <span className="price">{currency.format(product.price)}</span>
                    <span className="stock">Age {product.ageGroup}</span>
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
    </div>
  );
};

export default HomePage;
