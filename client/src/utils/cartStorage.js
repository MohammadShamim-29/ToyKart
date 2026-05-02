export const CART_KEY = "toykart-cart-v1";

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
  if (!line || !line.productId) return null;
  const qty = Math.max(1, Number(line.qty) || 1);
  const countRaw = line.countInStock;
  const countInStock = countRaw != null ? Math.max(0, Number(countRaw)) : Number.POSITIVE_INFINITY;
  return {
    productId: line.productId,
    name: line.name ?? "",
    image: line.image ?? "",
    price: Number(line.price) || 0,
    qty,
    countInStock,
    sku: line.sku ?? ""
  };
};

export const readCartItems = () => {
  const raw = readJson(CART_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeCartLine).filter(Boolean);
};

export const writeCartItems = (items) => {
  const serializable = items.map(({ productId, name, image, price, qty, countInStock, sku }) => ({
    productId,
    name,
    image,
    price,
    qty,
    countInStock: Number.isFinite(countInStock) ? countInStock : undefined,
    sku
  }));
  localStorage.setItem(CART_KEY, JSON.stringify(serializable));
};
