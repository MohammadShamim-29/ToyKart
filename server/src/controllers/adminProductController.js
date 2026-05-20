import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

function coerceCategoryId(category) {
  if (category == null || category === "") return undefined;
  if (typeof category === "object") {
    const id = category.id ?? category._id;
    if (id != null) return String(id).trim();
    return undefined;
  }
  return String(category).trim();
}

function normalizeProductBody(body, { isCreate } = { isCreate: false }) {
  const out = {};

  const assign = (key, value) => {
    if (value !== undefined) out[key] = value;
  };

  assign("name", body.name !== undefined ? String(body.name).trim() : undefined);
  assign("slug", body.slug !== undefined ? String(body.slug).trim().toLowerCase() : undefined);
  assign("sku", body.sku !== undefined ? String(body.sku).trim().toUpperCase() : undefined);
  assign("description", body.description !== undefined ? String(body.description).trim() : undefined);
  if (body.image !== undefined) {
    const img = typeof body.image === "string" ? body.image.trim() : body.image;
    assign("image", img === "" ? undefined : img);
  }
  if (body.gallery !== undefined) {
    let g = body.gallery;
    if (typeof g === "string") {
      g = g
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (!Array.isArray(g)) {
      g = [];
    }
    out.gallery = g.map((url) => String(url).trim()).filter(Boolean);
  }
  assign("brand", body.brand !== undefined ? String(body.brand).trim() : undefined);
  assign("manufacturerLocation", body.manufacturerLocation);
  assign("countryOfOrigin", body.countryOfOrigin);
  assign("category", coerceCategoryId(body.category));
  assign("subcategory", body.subcategory);
  assign("ageGroup", body.ageGroup);
  assign("material", body.material);
  assign("safetyCertifications", body.safetyCertifications);
  assign("tags", body.tags);
  assign("price", body.price !== undefined ? Number(body.price) : undefined);
  assign("currency", body.currency);
  assign("countInStock", body.countInStock !== undefined ? Number(body.countInStock) : undefined);
  assign("soldCount", body.soldCount !== undefined ? Number(body.soldCount) : undefined);
  assign("isFeatured", body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined);
  assign("newArrival", body.newArrival !== undefined ? Boolean(body.newArrival) : undefined);
  assign("status", body.status);
  assign("rating", body.rating !== undefined ? Number(body.rating) : undefined);
  assign("numReviews", body.numReviews !== undefined ? Number(body.numReviews) : undefined);
  assign("dimensionsCm", body.dimensionsCm);
  assign("weightGrams", body.weightGrams !== undefined ? Number(body.weightGrams) : undefined);

  if (isCreate) {
    const required = ["name", "slug", "sku", "description", "category", "price", "countInStock"];
    for (const key of required) {
      if (out[key] === undefined || out[key] === "" || Number.isNaN(out[key])) {
        return { error: `${key} is required` };
      }
    }
  }

  return { doc: out };
}

async function assertCategoryUsable(categoryId, { requireActive } = { requireActive: true }) {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return { error: "Invalid category id" };
  }
  const categoryD = await Category.findById(categoryId);
  if (!categoryD) {
    return { error: "Category not found" };
  }
  if (requireActive && !categoryD.isActive) {
    return { error: "Category is inactive" };
  }
  return { category: categoryD };
}

export const listAdminProducts = async (req, res) => {
  const products = await Product.find()
    .populate("category", "name slug isActive")
    .sort({ createdAt: -1 });
  return res.json(products);
};

export const getAdminProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }
  const product = await Product.findById(id).populate("category", "name slug");
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.json(product);
};

export const createAdminProduct = async (req, res) => {
  console.log("[ToyKart Admin] createAdminProduct hit", req.body?.name);
  const parsed = normalizeProductBody(req.body, { isCreate: true });
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const catCheck = await assertCategoryUsable(parsed.doc.category);
  if (catCheck.error) {
    return res.status(400).json({ message: catCheck.error });
  }

  try {
    const product = await Product.create(parsed.doc);
    await product.populate("category", "name slug");
    return res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate slug or SKU" });
    }
    throw err;
  }
};

export const updateAdminProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const parsed = normalizeProductBody(req.body, { isCreate: false });
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  if (parsed.doc.category !== undefined) {
    const sameCategory =
      product.category && String(product.category) === String(parsed.doc.category);
    const catCheck = await assertCategoryUsable(parsed.doc.category, {
      requireActive: !sameCategory
    });
    if (catCheck.error) {
      return res.status(400).json({ message: catCheck.error });
    }
  }

  Object.assign(product, parsed.doc);

  try {
    await product.save();
    await product.populate("category", "name slug");
    return res.json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate slug or SKU" });
    }
    throw err;
  }
};

export const deleteAdminProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { status: "discontinued" },
    { new: true }
  ).populate("category", "name slug");

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json({ message: "Product marked discontinued", product });
};
