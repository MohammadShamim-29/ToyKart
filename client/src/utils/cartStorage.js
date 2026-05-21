export const CART_KEY = "toykart-cart-v2";

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const normalizeCartLine = (line) => {
  const productId = line?.productId || line?._id || line?.id;
  if (!line || !productId) return null;
  const qty = Math.max(1, Number(line.qty) || 1);
  const countRaw = line.countInStock;
  const countInStock = countRaw != null ? Math.max(0, Number(countRaw)) : Number.POSITIVE_INFINITY;
  return {
    productId,
    variantId: line.variantId ? String(line.variantId) : "",
    colorName: line.colorName ?? "",
    name: line.name ?? "",
    image: line.image ?? "",
    price: Number(line.price) || 0,
    qty,
    countInStock,
    sku: line.sku ?? ""
  };
};

export const readCartItems = () => {
  const raw = readJson(CART_KEY, null);
  if (raw == null) {
    const legacy = readJson("toykart-cart-v1", []);
    if (Array.isArray(legacy) && legacy.length > 0) {
      return legacy.map(normalizeCartLine).filter(Boolean);
    }
    return [];
  }
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeCartLine).filter(Boolean);
};

export const writeCartItems = (items) => {
  const serializable = items.map(
    ({ productId, variantId, colorName, name, image, price, qty, countInStock, sku }) => ({
      productId,
      variantId: variantId || "",
      colorName: colorName || "",
      name,
      image,
      price,
      qty,
      countInStock: Number.isFinite(countInStock) ? countInStock : undefined,
      sku
    })
  );
  localStorage.setItem(CART_KEY, JSON.stringify(serializable));
};
