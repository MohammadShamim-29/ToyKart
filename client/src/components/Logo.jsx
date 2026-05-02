import { Link } from "react-router-dom";
import logo from "../assets/toykart-logo.svg";

const Logo = ({ compact = false, to = "/" }) => {
  return (
    <Link className={`logo-link ${compact ? "compact" : ""}`} to={to} aria-label="ToyKart Home">
      <img src={logo} alt="ToyKart logo" className="logo-image" />
    </Link>
  );
};

export default Logo;
