import Category from "../models/Category.js";

/** Public list: active categories only, same sort as admin storefront expectations */
export const listPublicCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .select("name slug sortOrder")
    .lean();
  return res.json(categories);
};
