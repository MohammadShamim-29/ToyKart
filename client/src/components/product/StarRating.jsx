import clsx from "clsx";
import { Star } from "lucide-react";

const StarRating = ({ value = 0, onChange, size = 18, labelId }) => {
  const v = Math.min(5, Math.max(0, Math.round(Number(value) || 0)));
  const interactive = typeof onChange === "function";

  return (
    <div
      className={clsx("pd-stars", interactive && "pd-stars--interactive")}
      role={interactive ? "group" : undefined}
      aria-labelledby={labelId}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={clsx("pd-star-btn", star <= v && "is-on")}
          disabled={!interactive}
          onClick={() => interactive && onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star size={size} fill={star <= v ? "currentColor" : "none"} strokeWidth={star <= v ? 0 : 1.5} />
        </button>
      ))}
    </div>
  );
};

export const StarRatingReadOnly = ({ value = 0, size = 16 }) => {
  const raw = Math.min(5, Math.max(0, Number(value) || 0));
  const full = Math.round(raw);

  return (
    <span className="pd-stars pd-stars--readonly" aria-label={`${raw.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const starNum = i + 1;
        const on = starNum <= full;
        return (
          <Star
            key={starNum}
            size={size}
            className={clsx("pd-star-icon", on && "is-on")}
            fill={on ? "currentColor" : "none"}
            strokeWidth={on ? 0 : 1.5}
          />
        );
      })}
    </span>
  );
};

export default StarRating;
