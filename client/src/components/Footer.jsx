import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Globe, Mail, MessageCircle, SendHorizontal } from "lucide-react";
import api from "../api";
import Logo from "./Logo";

const Footer = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/categories");
        const rows = Array.isArray(data) ? data : [];
        setCategories(rows.filter((c) => c.isActive !== false).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
      } catch {
        setCategories([]);
      }
    };
    load();
  }, []);

  const accountHref = userInfo ? "/profile" : "/login?redirect=%2Fprofile";
  const ordersHref = userInfo ? "/orders" : "/login?redirect=%2Forders";

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="footer-logo-wrap">
            <Logo compact />
          </div>
          <p>
            A luxury toy destination for modern families in Bangladesh. Thoughtful curation, timeless design, and
            playful excellence.
          </p>
          <div className="socials">
            <a href="#" aria-label="Facebook">
              <Globe size={16} />
            </a>
            <a href="#" aria-label="Instagram">
              <MessageCircle size={16} />
            </a>
            <a href="#" aria-label="YouTube">
              <SendHorizontal size={16} />
            </a>
          </div>
        </div>

        <div>
          <h3>Collections</h3>
          <ul>
            {categories.length === 0 ? (
              <li>
                <Link to="/shop">Shop all</Link>
              </li>
            ) : (
              categories.map((cat) => (
                <li key={cat._id || cat.slug}>
                  <Link to={`/shop?category=${encodeURIComponent(cat.slug || cat._id)}`}>{cat.name}</Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h3>Client Care</h3>
          <ul>
            <li>
              <Link to={ordersHref}>Track Orders</Link>
            </li>
            <li>
              <Link to={accountHref}>My Account</Link>
            </li>
            <li>
              <Link to="/return-policy#return-refund-policy">Return Refund Policy</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3>Contact</h3>
          <ul className="contact-list">
            <li>
              <Mail size={15} /> hello@toykart.com
            </li>
            <li>Sat-Thu, 10:00 AM - 9:00 PM (BST)</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} ToyKart. All rights reserved.</p>
          <p>Secure checkout · Premium packaging · Nationwide delivery</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
