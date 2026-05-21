import clsx from "clsx";

const ProductColorSelector = ({ variants, selectedId, onSelect, required }) => {
  if (!Array.isArray(variants) || variants.length === 0) return null;

  return (
    <div className="pd-color-section">
      <div className="pd-color-head">
        <span className="pd-color-label">Color</span>
        {required ? <span className="pd-color-required">Required</span> : null}
      </div>
      <div className="pd-color-swatches" role="listbox" aria-label="Select color">
        {variants.map((variant) => {
          const id = String(variant._id);
          const selected = id === String(selectedId);
          const stock = Math.max(0, Number(variant.stock) || 0);
          const out = stock < 1;
          const swatchStyle = {
            backgroundColor: variant.colorCode || "#cccccc"
          };
          if (
            variant.colorCode &&
            /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(variant.colorCode) &&
            variant.colorCode.replace("#", "").toLowerCase() === "ffffff"
          ) {
            swatchStyle.boxShadow = "inset 0 0 0 1px rgba(15, 23, 42, 0.12)";
          }

          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={`${variant.colorName}, ${out ? "out of stock" : `${stock} in stock`}`}
              className={clsx(
                "pd-color-swatch",
                selected && "is-selected",
                out && "is-out"
              )}
              onClick={() => onSelect(variant)}
            >
              <span className="pd-color-dot" style={swatchStyle} aria-hidden="true" />
              <span className="pd-color-info">
                <span className="pd-color-name">{variant.colorName}</span>
                <span className={clsx("pd-color-stock", out && "pd-color-stock--out")}>
                  {out ? "Out of stock" : `${stock} in stock`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductColorSelector;
