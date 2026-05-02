import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import clsx from "clsx";
import { GitCompare, Heart, ShoppingCart } from "lucide-react";
import { addItem } from "../../app/cartSlice";

const WISH_KEY = "toykart-wishlist-v1";
const CMP_KEY = "toykart-compare-v1";

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJson = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

const ProductPurchaseActions = ({ product, inStock }) => {
  const dispatch = useDispatch();
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);
  const [cmp, setCmp] = useState(false);
  const [cartMsg, setCartMsg] = useState("");
  const toastTimer = useRef(null);

  const id = product?._id;

  useEffect(() => {
    if (!id) return;
    const w = readJson(WISH_KEY, []);
    const c = readJson(CMP_KEY, []);
    setWish(Array.isArray(w) && w.includes(id));
    setCmp(Array.isArray(c) && c.includes(id));
  }, [id]);

  const maxQty = useMemo(() => Math.max(1, product?.countInStock || 0), [product?.countInStock]);

  useEffect(() => {
    setQty(1);
  }, [id]);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    []
  );

  const toggleWish = () => {
    if (!id) return;
    const w = readJson(WISH_KEY, []);
    const set = new Set(Array.isArray(w) ? w : []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const next = [...set];
    writeJson(WISH_KEY, next);
    setWish(set.has(id));
  };

  const toggleCompare = () => {
    if (!id) return;
    let c = readJson(CMP_KEY, []);
    if (!Array.isArray(c)) c = [];
    const set = new Set(c);
    if (set.has(id)) set.delete(id);
    else {
      if (set.size >= 4) return;
      set.add(id);
    }
    const next = [...set];
    writeJson(CMP_KEY, next);
    setCmp(set.has(id));
  };

  const addCart = () => {
    if (!inStock || !product) return;
    const safeQty = Math.min(Math.max(1, qty), maxQty);
    dispatch(addItem({ product, quantity: safeQty }));
    setCartMsg("Added to cart");
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setCartMsg(""), 2200);
  };

  return (
    <div className="pd-purchase">
      <div className="pd-qty-row">
        <label className="pd-qty-label" htmlFor="pd-qty">
          Quantity
        </label>
        <input
          id="pd-qty"
          className="pd-qty-input"
          type="number"
          min={1}
          max={maxQty}
          value={qty}
          disabled={!inStock}
          onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value) || 1)))}
        />
      </div>
      <div className="pd-cta-row">
        <button type="button" className="btn btn-primary pd-add-cart" disabled={!inStock} onClick={addCart}>
          <ShoppingCart size={20} />
          Add to cart
        </button>
        <button
          type="button"
          className={clsx("btn btn-secondary pd-icon-cta", wish && "is-active")}
          aria-pressed={wish}
          aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
          onClick={toggleWish}
        >
          <Heart size={20} fill={wish ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          className={clsx("btn btn-secondary pd-icon-cta", cmp && "is-active")}
          aria-pressed={cmp}
          aria-label={cmp ? "Remove from compare" : "Add to compare"}
          onClick={toggleCompare}
        >
          <GitCompare size={20} />
        </button>
      </div>
      {cartMsg ? <p className="pd-cart-toast">{cartMsg}</p> : null}
    </div>
  );
};

export default ProductPurchaseActions;
