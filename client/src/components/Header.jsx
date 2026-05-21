import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import { ChevronDown, MapPin, Search, ShoppingBag, UserRound } from "lucide-react";
import { logout } from "../app/store";
import { selectCartItemCount } from "../app/cartSlice";
import Logo from "./Logo";
import api from "../api";

const Header = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const cartCount = useSelector(selectCartItemCount);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartPulse, setCartPulse] = useState(false);
  const pulseTimer = useRef(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/categories");
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const onCartAdded = () => {
      setCartPulse(true);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
      pulseTimer.current = window.setTimeout(() => setCartPulse(false), 560);
    };
    window.addEventListener("toykart:cart-added", onCartAdded);
    return () => {
      window.removeEventListener("toykart:cart-added", onCartAdded);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    };
  }, []);

  const onLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const k = searchParams.get("keyword") || "";
    setKeyword(k);
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/shop?keyword=${encodeURIComponent(keyword.trim())}`);
    } else {
      navigate("/shop");
    }
  };

  return (
    <header className="header-shell">
      <div className="top-header">
        <div className="container top-header-inner">
          <div className="top-left">
            <span>
              <MapPin size={14} /> Luxury toys delivered across Bangladesh
            </span>
          </div>
          <div className="top-right">
            <Link to="/shop">Collection</Link>
            <Link to="/orders">Track Order</Link>
            <span>
              BDT <ChevronDown size={13} />
            </span>
          </div>
        </div>
      </div>

      <div className="header-main">
        <div className="container header-main-inner">
          <Logo />

          <nav className="main-nav">
            <NavLink className={({ isActive }) => clsx("nav-link", isActive && "is-active")} to="/">
              Home
            </NavLink>
            <NavLink className={({ isActive }) => clsx("nav-link", isActive && "is-active")} to="/shop">
              Shop
            </NavLink>
            <div className="nav-dropdown-wrap" onMouseEnter={(e) => e.currentTarget.classList.add('is-hovered')} onMouseLeave={(e) => e.currentTarget.classList.remove('is-hovered')} style={{ position: 'relative' }}>
              <button type="button" className="nav-link" style={{ background: 'none', border: 'none', font: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Categories <ChevronDown size={14} />
              </button>
              <div className="browse-dropdown" style={{ display: 'none', top: '100%', left: '0', minWidth: '180px' }}>
                <ul className="browse-dropdown-list">
                  {categories.map((cat) => (
                    <li key={cat._id}>
                      <Link className="browse-dropdown-link" to={`/shop?category=${cat.slug || cat._id}`}>
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                  {categories.length === 0 && <li className="browse-dropdown-empty">No categories</li>}
                </ul>
              </div>
              <style>{`
                .nav-dropdown-wrap.is-hovered .browse-dropdown {
                  display: block !important;
                }
              `}</style>
            </div>
            <NavLink className={({ isActive }) => clsx("nav-link", isActive && "is-active")} to="/new-arrivals">
              New Arrivals
            </NavLink>
            {userInfo && (
              <NavLink className={({ isActive }) => clsx("nav-link", isActive && "is-active")} to="/orders">
                Orders
              </NavLink>
            )}
            {userInfo?.isAdmin && (
              <NavLink className={({ isActive }) => clsx("nav-link", isActive && "is-active")} to="/admin">
                Admin
              </NavLink>
            )}
          </nav>

          <div className="header-actions">
            <form className="header-search compact-search" role="search" onSubmit={handleSearch}>
              <input 
                type="search" 
                placeholder="Search toys..." 
                aria-label="Search toys" 
                value={keyword}
                onChange={(e) => {
                  const val = e.target.value;
                  setKeyword(val);
                  if (val.trim()) {
                    navigate(`/shop?keyword=${encodeURIComponent(val.trim())}`);
                  } else if (location.pathname === '/shop') {
                    navigate("/shop");
                  }
                }}
              />
              <button type="submit" aria-label="Search">
                <Search size={16} />
              </button>
            </form>

            <div className="header-tools">
              
              <Link className={clsx("tool-item cart-tool icon-only", cartPulse && "is-pulsing")} to="/cart" aria-label="Cart">
                <span className="cart-tool-icon-wrap">
                  <ShoppingBag size={18} />
                  {cartCount > 0 ? <span className="cart-count-badge">{cartCount}</span> : null}
                </span>
              </Link>

              {userInfo ? (
                <div className="user-menu-wrap" style={{ position: "relative" }} onMouseEnter={(e) => e.currentTarget.classList.add('is-hovered')} onMouseLeave={(e) => e.currentTarget.classList.remove('is-hovered')}>
                  <Link to="/profile" className="tool-item icon-only profile-trigger-btn" aria-label="Account">
                    {userInfo.avatar ? (
                      <img src={userInfo.avatar} alt={userInfo.name} className="header-avatar" />
                    ) : (
                      <UserRound size={18} />
                    )}
                  </Link>
                  <div className="account-dropdown browse-dropdown" style={{ display: "none", right: 0, left: "auto", minWidth: "180px", paddingTop: "10px" }}>
                    <div className="dropdown-gap-filler" style={{ position: 'absolute', top: '-10px', height: '10px', width: '100%' }}></div>
                    <ul className="browse-dropdown-list">
                      <li className="dropdown-user-info">
                        <p className="dropdown-user-name">{userInfo.name}</p>
                        <p className="dropdown-user-email">{userInfo.email}</p>
                      </li>
                      <li className="dropdown-divider"></li>
                      <li>
                        <Link className="browse-dropdown-link" to="/profile">My Profile</Link>
                      </li>
                      <li>
                        <Link className="browse-dropdown-link" to="/orders">My Orders</Link>
                      </li>
                      <li className="dropdown-divider"></li>
                      <li>
                        <button type="button" onClick={onLogout} className="browse-dropdown-link logout-btn">Logout</button>
                      </li>
                    </ul>
                  </div>
                  <style>{`
                    .user-menu-wrap.is-hovered .account-dropdown {
                      display: block !important;
                    }
                    .header-avatar {
                      width: 28px;
                      height: 28px;
                      border-radius: 8px;
                      object-fit: cover;
                    }
                    .dropdown-user-info {
                      padding: 0.75rem 1rem;
                    }
                    .dropdown-user-name {
                      font-weight: 700;
                      font-size: 0.9rem;
                      color: var(--ink);
                    }
                    .dropdown-user-email {
                      font-size: 0.75rem;
                      color: var(--muted);
                    }
                    .dropdown-divider {
                      height: 1px;
                      background: var(--line);
                      margin: 0.25rem 0.5rem;
                    }
                    .logout-btn {
                      width: 100%;
                      text-align: left;
                      background: none;
                      border: none;
                      cursor: pointer;
                      font: inherit;
                      color: var(--danger) !important;
                    }
                    .profile-trigger-btn:hover {
                      background: var(--surface-soft);
                    }
                  `}</style>
                </div>
              ) : (
                <Link className="tool-item icon-only" to="/login" aria-label="Account">
                  <UserRound size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
