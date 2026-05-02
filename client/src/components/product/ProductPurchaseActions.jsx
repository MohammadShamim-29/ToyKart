import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import clsx from "clsx";
import { GitCompare, ShoppingCart } from "lucide-react";
import { addToCartAjax } from "../../app/addToCartAjax";

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
  const [cmp, setCmp] = useState(false);
  const [cartMsg, setCartMsg] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const toastTimer = useRef(null);

  const id = product?._id;

  useEffect(() => {
    if (!id) return;
    const c = readJson(CMP_KEY, []);
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

  const addCart = async () => {
    if (!inStock || !product) return;
    if (isAdding) return;
    const safeQty = Math.min(Math.max(1, qty), maxQty);
    setIsAdding(true);
    try {
      await addToCartAjax({ dispatch, product, quantity: safeQty });
      setCartMsg("Added to cart");
      setIsAdded(true);
      window.setTimeout(() => setIsAdded(false), 900);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setCartMsg(""), 2200);
    } catch (err) {
      setCartMsg(err.response?.data?.message || err.message || "Could not add to cart");
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setCartMsg(""), 2600);
    } finally {
      setIsAdding(false);
    }
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
        <button
          type="button"
          className={clsx("btn btn-primary pd-add-cart", isAdded && "cart-btn-added")}
          disabled={!inStock || isAdding}
          onClick={addCart}
        >
          <ShoppingCart size={20} />
          {isAdding ? "Adding..." : isAdded ? "Added" : "Add to cart"}
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
