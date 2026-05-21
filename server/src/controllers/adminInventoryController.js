import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const validObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id ?? ""));

export const listInventoryCategories = async (req, res) => {
  const categories = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean();

  const counts = await Product.aggregate([
    { $match: { status: { $ne: "discontinued" } } },
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);
  const countByCategory = Object.fromEntries(counts.map((row) => [String(row._id), row.count]));

  return res.json(
    categories.map((cat) => ({
      id: cat._id,
      name: cat.name,
      slug: cat.slug,
      isActive: cat.isActive,
      productCount: countByCategory[String(cat._id)] ?? 0
    }))
  );
};

export const listInventoryProductsByCategory = async (req, res) => {
  const categoryId = String(req.query.category ?? "").trim();
  if (!validObjectId(categoryId)) {
    return res.status(400).json({ message: "Valid category id is required" });
  }

  const category = await Category.findById(categoryId).lean();
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  const products = await Product.find({
    category: categoryId,
    status: { $ne: "discontinued" }
  })
    .select("name sku countInStock status image colorVariants")
    .sort({ name: 1 })
    .lean();

  return res.json({
    category: { id: category._id, name: category.name, slug: category.slug },
    products: products.map((p) => {
      const variants = Array.isArray(p.colorVariants) ? p.colorVariants : [];
      return {
        id: p._id,
        name: p.name,
        sku: p.sku,
        countInStock: p.countInStock ?? 0,
        status: p.status,
        image: p.image,
        hasVariants: variants.length > 0,
        variantCount: variants.length
      };
    })
  });
};

export const getInventoryProductStock = async (req, res) => {
  const productId = String(req.params.id ?? "").trim();
  if (!validObjectId(productId)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const product = await Product.findById(productId).populate("category", "name slug").lean();
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const variants = (product.colorVariants || []).map((v) => ({
    id: v._id,
    colorName: v.colorName,
    colorCode: v.colorCode || "#cccccc",
    stock: Math.max(0, Number(v.stock) || 0),
    sku: v.sku || "",
    isFeatured: Boolean(v.isFeatured)
  }));

  const totalFromVariants = variants.reduce((sum, v) => sum + v.stock, 0);

  return res.json({
    id: product._id,
    name: product.name,
    sku: product.sku,
    countInStock: product.countInStock ?? 0,
    status: product.status,
    image: product.image,
    category: product.category
      ? { id: product.category._id, name: product.category.name, slug: product.category.slug }
      : null,
    hasVariants: variants.length > 0,
    variants,
    totalFromVariants
  });
};
