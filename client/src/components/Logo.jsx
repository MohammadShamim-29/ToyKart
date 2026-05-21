import { useId } from "react";
import { Link } from "react-router-dom";

const Logo = ({ compact = false, to = "/", className = "", showTagline }) => {
  const uid = useId().replace(/:/g, "");
  const markGrad = `tk-mark-${uid}`;
  const textGrad = `tk-text-${uid}`;
  const glow = `tk-glow-${uid}`;
  const tagline = showTagline ?? !compact;

  return (
    <Link
      className={`logo-link ${compact ? "compact" : ""} ${className}`.trim()}
      to={to}
      aria-label="ToyKart Home"
    >
      <svg
        className="logo-svg"
        viewBox={compact ? "0 0 168 44" : "0 0 220 52"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby={`${uid}-title`}
      >
        <title id={`${uid}-title`}>ToyKart</title>
        <defs>
          <linearGradient id={markGrad} x1="4" y1="8" x2="40" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4F7CFF" />
            <stop offset="0.55" stopColor="#7C5CFF" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
          <linearGradient id={textGrad} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop stopColor="#4F7CFF" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
          <filter id={glow} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Mark */}
        <rect x="2" y="6" width="40" height="40" rx="13" fill={`url(#${markGrad})`} />
        <rect x="2" y="6" width="40" height="40" rx="13" fill="white" fillOpacity="0.12" />
        <ellipse cx="14" cy="14" rx="10" ry="7" fill="white" fillOpacity="0.18" />

        {/* Gift box */}
        <rect x="12" y="24" width="20" height="11" rx="2.2" fill="white" fillOpacity="0.95" />
        <rect x="10" y="19.5" width="24" height="5.5" rx="1.8" fill="white" />
        <rect x="19" y="19.5" width="6" height="15.5" fill="#FBBF24" fillOpacity="0.95" />
        <ellipse cx="16.2" cy="18.5" rx="3.2" ry="2.2" fill="#FDE68A" />
        <ellipse cx="23.8" cy="18.5" rx="3.2" ry="2.2" fill="#FDE68A" />
        <circle cx="22" cy="18.8" r="1.4" fill="#F59E0B" />

        {/* Sparkle */}
        <path
          d="M36 11.5 37.2 14.8 40.5 16 37.2 17.2 36 20.5 34.8 17.2 31.5 16 34.8 14.8Z"
          fill="#FDE68A"
          filter={`url(#${glow})`}
        />

        {/* Wordmark */}
        <text
          x="52"
          y={compact ? 27 : 29}
          fontFamily="Outfit, system-ui, sans-serif"
          fontSize={compact ? 20 : 23}
          fontWeight="600"
          letterSpacing="-0.03em"
        >
          <tspan className="logo-toy" fill="#0F172A">
            Toy
          </tspan>
          <tspan fontWeight="700" fill={`url(#${textGrad})`}>
            Kart
          </tspan>
        </text>

        {tagline ? (
          <text
            x="52"
            y={compact ? 38 : 43}
            fontFamily="Outfit, system-ui, sans-serif"
            fontSize={compact ? 8.5 : 9.5}
            fontWeight="500"
            letterSpacing="0.16em"
            className="logo-tagline"
            fill="#64748B"
          >
            PLAY · LEARN · GROW
          </text>
        ) : null}
      </svg>
    </Link>
  );
};

export default Logo;
