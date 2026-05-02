import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import { ChevronDown, Heart, MapPin, Search, ShoppingBag, UserRound } from "lucide-react";
import { logout } from "../app/store";
import Logo from "./Logo";

const Header = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLogout = () => {
    dispatch(logout());
    navigate("/");
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
            <a href="#catalog">Collection</a>
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

          <form className="header-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <input type="search" placeholder="Search premium toys..." aria-label="Search toys" />
            <button type="submit" aria-label="Search">
              <Search size={16} />
            </button>
          </form>

          <div className="header-tools">
            <Link className="tool-item" to="/register">
              <Heart size={17} />
              <span>Wishlist</span>
            </Link>
            <Link className="tool-item" to="/orders">
              <ShoppingBag size={17} />
              <span>Cart</span>
            </Link>
            {userInfo ? (
              <button type="button" onClick={onLogout} className="tool-item btn btn-ghost logout-btn">
                <UserRound size={17} />
                <span>Logout</span>
              </button>
            ) : (
              <Link className="tool-item" to="/login">
                <UserRound size={17} />
                <span>Account</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="header-nav-row">
        <div className="container nav-row-inner">
          <button type="button" className="browse-btn">
            Categories <ChevronDown size={15} />
          </button>

          <nav className="main-nav">
            <NavLink className={({ isActive }) => clsx("nav-link", isActive && "is-active")} to="/">
              Home
            </NavLink>
            <a href="#catalog" className="nav-link">
              Collection
            </a>
            <NavLink className={({ isActive }) => clsx("nav-link", isActive && "is-active")} to="/new-arrivals">
              New Arrivals
            </NavLink>
            <NavLink className={({ isActive }) => clsx("nav-link", isActive && "is-active")} to="/orders">
              My Orders
            </NavLink>
            {userInfo?.isAdmin && (
              <NavLink className={({ isActive }) => clsx("nav-link", isActive && "is-active")} to="/admin">
                Admin
              </NavLink>
            )}
          </nav>

          {!userInfo && (
            <NavLink className={({ isActive }) => clsx("btn btn-primary", isActive && "is-active")} to="/register">
              Register
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
