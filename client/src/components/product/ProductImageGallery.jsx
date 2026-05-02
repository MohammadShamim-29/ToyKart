import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ProductImageGallery = ({ images, alt }) => {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [images]);

  const safeLen = list.length;
  const safeIndex = safeLen ? Math.min(index, safeLen - 1) : 0;
  const active = list[safeIndex] || "";

  const go = useCallback(
    (delta) => {
      if (!safeLen) return;
      setIndex((i) => (i + delta + safeLen) % safeLen);
    },
    [safeLen]
  );

  if (!active) {
    return (
      <div className="pd-gallery">
        <div className="pd-gallery-main pd-gallery-main--empty" role="img" aria-label={alt} />
      </div>
    );
  }

  return (
    <div className="pd-gallery">
      {safeLen > 1 ? (
        <div className="pd-gallery-thumbs" aria-label="Product thumbnails">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className={clsx("pd-gallery-thumb", i === safeIndex && "is-active")}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === safeIndex ? "true" : undefined}
            >
              <img src={src} alt="" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="pd-gallery-main-wrap">
        {safeLen > 1 ? (
          <div className="pd-gallery-nav">
            <button type="button" className="pd-gallery-arrow" onClick={() => go(-1)} aria-label="Previous image">
              <ChevronLeft size={22} />
            </button>
            <button type="button" className="pd-gallery-arrow" onClick={() => go(1)} aria-label="Next image">
              <ChevronRight size={22} />
            </button>
          </div>
        ) : null}
        <figure className="pd-gallery-main">
          <div className="pd-gallery-zoom">
            <img src={active} alt={alt} decoding="async" />
          </div>
        </figure>
        {safeLen > 1 ? (
          <p className="pd-gallery-counter">
            {safeIndex + 1} / {safeLen}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default ProductImageGallery;
