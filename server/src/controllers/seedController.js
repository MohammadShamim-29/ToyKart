import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { bangladeshiToyProducts } from "../data/products.js";
import { slugify } from "../utils/slugify.js";

dotenv.config();

async function migrateLegacyStringCategories() {
  const docs = await Product.collection.find({ category: { $type: "string" } }).toArray();
  if (docs.length === 0) return;

  const uniqueNames = [...new Set(docs.map((d) => d.category))];
  const idByName = new Map();
  let order = 0;
  for (const name of uniqueNames) {
    const slug = slugify(name);
    const cat = await Category.findOneAndUpdate(
      { slug },
      {
        $set: { name, slug, isActive: true },
        $setOnInsert: { sortOrder: order++ }
      },
      { upsert: true, new: true }
    );
    idByName.set(name, cat._id);
  }

  for (const doc of docs) {
    const catId = idByName.get(doc.category);
    if (catId) {
      await Product.collection.updateOne({ _id: doc._id }, { $set: { category: catId } });
    }
  }
}

async function ensureCategoryMapFromSeed() {
  const uniqueNames = [...new Set(bangladeshiToyProducts.map((p) => p.category))];
  const map = new Map();
  let order = 0;
  for (const name of uniqueNames) {
    const slug = slugify(name);
    const cat = await Category.findOneAndUpdate(
      { slug },
      {
        $set: { name, slug, isActive: true },
        $setOnInsert: { sortOrder: order }
      },
      { upsert: true, new: true }
    );
    map.set(name, cat._id);
    order += 1;
  }
  return map;
}

const run = async () => {
  try {
    await connectDB();

    await migrateLegacyStringCategories();
    const categoryIdByName = await ensureCategoryMapFromSeed();

    const operations = bangladeshiToyProducts.map((product) => {
      const categoryId = categoryIdByName.get(product.category);
      if (!categoryId) {
        throw new Error(`Missing category mapping for: ${product.category}`);
      }
      const { category: _categoryName, ...rest } = product;
      const doc = { ...rest, category: categoryId };
      return {
        updateOne: {
          filter: { slug: product.slug },
          update: { $set: doc },
          upsert: true
        }
      };
    });

    const result = await Product.bulkWrite(operations, { ordered: false });

    console.log(
      `Seed complete: ${result.upsertedCount || 0} inserted, ${result.modifiedCount || 0} updated, ${bangladeshiToyProducts.length} total in dataset`
    );
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

run();
