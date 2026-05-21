import { Link } from "react-router-dom";

const LogoToyBox = ({ compact = false, to = "/" }) => (
  <Link to={to} className="inline-flex items-center gap-2.5 no-underline" aria-label="ToyBox Home">
    <span
      className="grid shrink-0 place-items-center rounded-full font-display font-bold text-white"
      style={{
        width: compact ? 36 : 44,
        height: compact ? 36 : 44,
        fontSize: compact ? "1.1rem" : "1.25rem",
        background: "var(--candy-pink)",
        boxShadow: "var(--shadow-candy)"
      }}
    >
      T
    </span>
    <span
      className="font-display font-bold leading-none"
      style={{ fontSize: compact ? "1.25rem" : "1.5rem", color: "var(--candy-navy)" }}
    >
      ToyBox<span style={{ color: "var(--candy-pink)" }}>.</span>
    </span>
  </Link>
);

export default LogoToyBox;
