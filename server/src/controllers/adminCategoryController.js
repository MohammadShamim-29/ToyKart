import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { slugify } from "../utils/slugify.js";

function categoryIdFromParams(req, res) {
  const raw = req.params.id;
  if (raw == null || String(raw).trim() === "" || String(raw) === "[object Object]") {
    res.status(400).json({ message: "Invalid category id" });
    return null;
  }
  const id = String(raw).trim();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid category id" });
    return null;
  }
  return id;
}

export const listAdminCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  return res.json(categories);
};

export const getAdminCategory = async (req, res) => {
  const id = categoryIdFromParams(req, res);
  if (!id) return;
  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }
  return res.json(category);
};

export const createAdminCategory = async (req, res) => {
  const { name, slug, description, isActive, sortOrder } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }

  const finalSlug = slug?.trim() ? slugify(slug) : slugify(name);
  const exists = await Category.findOne({ slug: finalSlug });
  if (exists) {
    return res.status(400).json({ message: "Slug already in use" });
  }

  let normalizedSortOrder = 0;
  if (sortOrder !== undefined) {
    const n = Number(sortOrder);
    if (!Number.isFinite(n)) {
      return res.status(400).json({ message: "sortOrder must be a valid number ≥ 0" });
    }
    if (n < 0) {
      return res.status(400).json({ message: "sortOrder cannot be negative" });
    }
    normalizedSortOrder = n;
  }

  const category = await Category.create({
    name: name.trim(),
    slug: finalSlug,
    description: description?.trim() ?? "",
    isActive: isActive !== false,
    sortOrder: normalizedSortOrder
  });

  return res.status(201).json(category);
};

export const updateAdminCategory = async (req, res) => {
  const id = categoryIdFromParams(req, res);
  if (!id) return;
  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  const { name, slug, description, isActive, sortOrder } = req.body;

  if (name !== undefined) category.name = String(name).trim();
  if (slug !== undefined) category.slug = slugify(slug);
  if (description !== undefined) category.description = String(description).trim();
  if (isActive !== undefined) category.isActive = Boolean(isActive);
  if (sortOrder !== undefined) {
    const n = Number(sortOrder);
    if (!Number.isFinite(n)) {
      return res.status(400).json({ message: "sortOrder must be a valid number ≥ 0" });
    }
    if (n < 0) {
      return res.status(400).json({ message: "sortOrder cannot be negative" });
    }
    category.sortOrder = n;
  }

  if (slug !== undefined) {
    const dup = await Category.findOne({
      slug: category.slug,
      _id: { $ne: category._id }
    });
    if (dup) {
      return res.status(400).json({ message: "Slug already in use" });
    }
  }

  await category.save();
  return res.json(category);
};

export const deleteAdminCategory = async (req, res) => {
  const id = categoryIdFromParams(req, res);
  if (!id) return;

  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  // Check if any active products use this category
  const activeProduct = await Product.findOne({
    category: category._id,
    status: { $ne: "discontinued" }
  });
  if (activeProduct) {
    return res.status(400).json({
      message: "Cannot deactivate category — it has active products. Reassign or discontinue them first."
    });
  }

  category.isActive = false;
  await category.save();

  return res.json({ message: "Category deactivated", category });
};
