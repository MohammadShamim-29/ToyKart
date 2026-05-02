import Product from "../models/Product.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;
const DEFAULT_SUGGEST_LIMIT = 8;
const MAX_SUGGEST_LIMIT = 12;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeSearch = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const tokenizeSearch = (value) =>
  normalizeSearch(value)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);

const buildFlexibleRegex = (token) => {
  const escapedChars = [...String(token || "")]
    .map((char) => escapeRegex(char))
    .filter(Boolean);
  if (escapedChars.length === 0) return null;
  return new RegExp(escapedChars.join(".*"), "i");
};

const SORT_MAP = {
  featured: { isFeatured: -1, createdAt: -1, _id: -1 },
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  "price-asc": { price: 1, _id: 1 },
  "price-desc": { price: -1, _id: -1 },
  "rating-desc": { rating: -1, numReviews: -1, _id: -1 },
  "name-asc": { name: 1, _id: 1 },
  "name-desc": { name: -1, _id: -1 }
};

export const getProducts = async (req, res) => {
  const keywordRaw = String(req.query.keyword ?? req.query.q ?? "").trim();
  const categoryRaw = String(req.query.category ?? "").trim();
  const brandRaw = String(req.query.brand ?? "").trim();
  const ageGroupRaw = String(req.query.ageGroup ?? "").trim();
  const minPriceRaw = req.query.minPrice;
  const maxPriceRaw = req.query.maxPrice;
  const sortRaw = String(req.query.sort ?? "featured").trim().toLowerCase();
  const page = toPositiveInt(req.query.page, 1);
  const requestedLimit = toPositiveInt(req.query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const newArrivalRaw = req.query.newArrival;

  const query = { status: "active" };

  if (newArrivalRaw !== undefined) {
    const normalized = String(newArrivalRaw).trim().toLowerCase();
    query.newArrival = ["1", "true", "yes"].includes(normalized);
  }

  if (keywordRaw) {
    const normalizedKeyword = normalizeSearch(keywordRaw);
    const keywordTokens = tokenizeSearch(keywordRaw);
    const safeKeywordRegex = new RegExp(escapeRegex(normalizedKeyword), "i");
    const keywordCategoryMatches = await Category.find({ name: safeKeywordRegex }).select("_id").lean();
    const keywordCategoryIds = keywordCategoryMatches.map((c) => c._id);

    const perTokenConditions = keywordTokens.map((token) => {
      const directRegex = new RegExp(escapeRegex(token), "i");
      const flexibleRegex = token.length >= 2 ? buildFlexibleRegex(token) : null;
      const base = [
        { name: directRegex },
        { brand: directRegex },
        { description: directRegex },
        { tags: directRegex },
        { sku: directRegex },
        { slug: directRegex }
      ];

      if (flexibleRegex) {
        base.push({ name: flexibleRegex }, { brand: flexibleRegex }, { tags: flexibleRegex });
      }

      return { $or: base };
    });

    const phraseConditions = [
      { name: safeKeywordRegex },
      { description: safeKeywordRegex },
      { brand: safeKeywordRegex },
      { tags: safeKeywordRegex },
      { sku: safeKeywordRegex },
      { slug: safeKeywordRegex }
    ];
    if (keywordCategoryIds.length > 0) {
      phraseConditions.push({ category: { $in: keywordCategoryIds } });
    }

    query.$and = [{ $or: phraseConditions }, ...perTokenConditions];
  }

  if (brandRaw) {
    query.brand = { $regex: new RegExp(escapeRegex(brandRaw), "i") };
  }

  if (ageGroupRaw) {
    query.ageGroup = ageGroupRaw;
  }

  const minPrice = minPriceRaw !== undefined ? Number(minPriceRaw) : undefined;
  const maxPrice = maxPriceRaw !== undefined ? Number(maxPriceRaw) : undefined;
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    query.price = {};
    if (Number.isFinite(minPrice)) query.price.$gte = minPrice;
    if (Number.isFinite(maxPrice)) query.price.$lte = maxPrice;
  }

  if (categoryRaw) {
    const categoryMatch = categoryRaw.toLowerCase();
    const categoryDoc = await Category.findOne({ slug: categoryMatch }).select("_id").lean();
    if (categoryDoc?._id) {
      query.category = categoryDoc._id;
    } else if (mongoose.Types.ObjectId.isValid(categoryRaw)) {
      query.category = categoryRaw;
    } else {
      return res.json({ items: [], page, pages: 0, total: 0 });
    }
  }

  const sort = SORT_MAP[sortRaw] ?? SORT_MAP.featured;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Product.find(query).populate("category", "name slug").sort(sort).skip(skip).limit(limit),
    Product.countDocuments(query)
  ]);

  const pages = total > 0 ? Math.ceil(total / limit) : 0;
  return res.json({ items, page, pages, total });
};

const scoreSuggestion = (product, queryText) => {
  const q = normalizeSearch(queryText);
  const name = normalizeSearch(product?.name);
  const brand = normalizeSearch(product?.brand);
  const slug = normalizeSearch(product?.slug);
  const sku = normalizeSearch(product?.sku);
  const tags = Array.isArray(product?.tags) ? product.tags.map((tag) => normalizeSearch(tag)) : [];

  let score = 0;
  if (name.startsWith(q)) score += 140;
  if (name.split(" ").some((w) => w.startsWith(q))) score += 100;
  if (name.includes(q)) score += 70;
  if (brand.startsWith(q)) score += 35;
  if (brand.includes(q)) score += 20;
  if (tags.some((t) => t.startsWith(q))) score += 20;
  if (tags.some((t) => t.includes(q))) score += 10;
  if (slug.includes(q)) score += 8;
  if (sku.includes(q)) score += 6;
  return score;
};

export const getProductSuggestions = async (req, res) => {
  const qRaw = String(req.query.q ?? req.query.keyword ?? "").trim();
  const q = normalizeSearch(qRaw);
  const limit = Math.min(toPositiveInt(req.query.limit, DEFAULT_SUGGEST_LIMIT), MAX_SUGGEST_LIMIT);

  if (q.length < 1) {
    return res.json({ items: [] });
  }

  const tokens = tokenizeSearch(q);
  const phraseRegex = new RegExp(escapeRegex(q), "i");
  const tokenClauses = tokens.map((token) => {
    const directRegex = new RegExp(escapeRegex(token), "i");
    return {
      $or: [
        { name: directRegex },
        { brand: directRegex },
        { tags: directRegex },
        { description: directRegex },
        { sku: directRegex },
        { slug: directRegex }
      ]
    };
  });

  const baseOr = [
    { name: phraseRegex },
    { brand: phraseRegex },
    { tags: phraseRegex },
    { description: phraseRegex },
    { sku: phraseRegex },
    { slug: phraseRegex }
  ];

  const candidates = await Product.find({
    status: "active",
    $and: [{ $or: baseOr }, ...tokenClauses]
  })
    .select("name slug sku image price brand tags")
    .sort({ isFeatured: -1, soldCount: -1, createdAt: -1 })
    .limit(40)
    .lean();

  const items = candidates
    .map((product) => ({ ...product, score: scoreSuggestion(product, q) }))
    .filter((product) => product.score > 0)
    .sort((a, b) => b.score - a.score || String(a.name || "").localeCompare(String(b.name || "")))
    .slice(0, limit)
    .map(({ score, ...product }) => product);

  return res.json({ items });
};

export const getProductById = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: "active" }).populate(
    "category",
    "name slug"
  );

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json(product);
};
