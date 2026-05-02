import { Link } from "react-router-dom";
import { Globe, Mail, MessageCircle, Phone, SendHorizontal } from "lucide-react";
import Logo from "./Logo";

const Footer = () => {
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
            <li>
              <a href="#catalog">Signature Learning</a>
            </li>
            <li>
              <a href="#catalog">STEM Atelier</a>
            </li>
            <li>
              <a href="#catalog">Creative Studio</a>
            </li>
            <li>
              <a href="#catalog">Outdoor Editions</a>
            </li>
          </ul>
        </div>

        <div>
          <h3>Client Care</h3>
          <ul>
            <li>
              <Link to="/orders">Track Orders</Link>
            </li>
            <li>
              <Link to="/login">My Account</Link>
            </li>
            <li>
              <a href="#">Delivery Policy</a>
            </li>
            <li>
              <a href="#">Returns & Exchange</a>
            </li>
          </ul>
        </div>

        <div>
          <h3>Concierge</h3>
          <ul className="contact-list">
            <li>
              <Phone size={15} /> +880 1700-123456
            </li>
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
