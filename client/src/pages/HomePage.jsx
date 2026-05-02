import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Palette, ShieldCheck, Truck } from "lucide-react";
import api from "../api";
import { categoryLabel } from "../utils/categoryLabel";

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0
});

const heroSlides = [
  {
    title: "Where Play Meets Imagination",
    subtitle: "Curated toys that make learning joyful and childhood colorful.",
    image:
      "https://images.unsplash.com/photo-1759680190851-199358b2cd8c?auto=format&fit=crop&w=1800&q=80",
    sourceLabel: "Unsplash",
    sourceUrl:
      "https://unsplash.com/photos/a-colorful-collection-of-small-plastic-toys-wh4psDv-NW8"
  },
  {
    title: "Calm, Creative, and Full of Wonder",
    subtitle: "Beautiful toys for focused play, storytelling, and everyday family moments.",
    image:
      "https://images.pexels.com/photos/18990727/pexels-photo-18990727.jpeg?cs=srgb&fm=jpg&w=1800",
    sourceLabel: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/adorable-kid-playing-with-constructor-set-at-home-18990727/"
  },
  {
    title: "Designed for Happy Little Explorers",
    subtitle: "Safe materials, thoughtful designs, and toys kids actually love to revisit.",
    image: "https://cdn.pixabay.com/photo/2020/03/20/06/40/baby-4949751_1280.jpg",
    sourceLabel: "Pixabay",
    sourceUrl: "https://pixabay.com/photos/baby-plays-toys-childrens-room-4949751/"
  }
];

const lifestyleGallery = [
  {
    image:
      "https://images.unsplash.com/photo-1685358259043-a367462adf15?auto=format&fit=crop&w=1200&q=80",
    title: "Fine Motor Practice",
    text: "Simple activities that build confidence and concentration.",
    source: "Unsplash"
  },
  {
    image:
      "https://images.pexels.com/photos/31152757/pexels-photo-31152757.jpeg?cs=srgb&fm=jpg&w=1200",
    title: "Home Play Corners",
    text: "Warm setups that invite independent, playful learning.",
    source: "Pexels"
  },
  {
    image: "https://cdn.pixabay.com/photo/2018/09/09/13/26/toys-3664574_640.jpg",
    title: "Natural Texture Toys",
    text: "Wooden textures and colors that feel timeless and calm.",
    source: "Pixabay"
  }
];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);

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

  const featuredProducts = useMemo(() => products.filter((product) => product.isFeatured).slice(0, 6), [products]);

  const currentSlide = heroSlides[activeSlide];

  return (
    <div className="home-clean stack-lg">
      <section className="hero-slider">
        <AnimatePresence mode="wait">
          <motion.article
            key={currentSlide.image}
            className="hero-slide"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
          >
            <img src={currentSlide.image} alt={currentSlide.title} className="hero-slide-image" />
            <div className="hero-slide-overlay" />
            <div className="hero-slide-content">
              <p className="eyebrow">ToyKart Collection</p>
              <h1>{currentSlide.title}</h1>
              <p>{currentSlide.subtitle}</p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#catalog">
                  Explore Products <ArrowRight size={15} />
                </a>
                <Link className="btn btn-secondary" to="/register">
                  Create Account
                </Link>
              </div>
              <a href={currentSlide.sourceUrl} target="_blank" rel="noreferrer" className="hero-credit">
                Photo source: {currentSlide.sourceLabel}
              </a>
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
      </section>

      <section className="trust-row">
        <article className="trust-card card">
          <ShieldCheck size={18} />
          <div>
            <h3>Safety First</h3>
            <p>Carefully selected items with child-safe focus.</p>
          </div>
        </article>
        <article className="trust-card card">
          <Truck size={18} />
          <div>
            <h3>Fast Delivery</h3>
            <p>Quick shipping across major cities in Bangladesh.</p>
          </div>
        </article>
        <article className="trust-card card">
          <Palette size={18} />
          <div>
            <h3>Playful Design</h3>
            <p>Colorful toys that still feel clean and modern.</p>
          </div>
        </article>
      </section>

      <section className="gallery-clean">
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

      <section className="stack-md" id="catalog">
        <div className="section-head">
          <h2>Featured Picks</h2>
          {!loading && !error && <p className="subtext">{products.length} products in catalog</p>}
        </div>

        {loading && <p className="notice">Loading products...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="grid cards-grid">
            {featuredProducts.map((product) => (
              <article className="card product-card" key={product._id}>
                <img src={product.image} alt={product.name} loading="lazy" />
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
                  <Link className="btn btn-secondary" to={`/product/${product._id}`}>
                    View Details
                  </Link>
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
