import mongoose from "mongoose";

const colorVariantSchema = new mongoose.Schema(
  {
    colorName: { type: String, required: true, trim: true, maxlength: 60 },
    colorCode: { type: String, trim: true, default: "#cccccc" },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, trim: true, uppercase: true, default: "" },
    image: { type: String, default: "" },
    gallery: [{ type: String }],
    /** Shown on shop cards and selected first on the product page */
    isFeatured: { type: Boolean, default: false }
  },
  { _id: true }
);

const dimensionsSchema = new mongoose.Schema(
  {
    length: { type: Number, min: 0, default: 0 },
    width: { type: Number, min: 0, default: 0 },
    height: { type: Number, min: 0, default: 0 }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true
    },
    description: { type: String, required: true, trim: true, minlength: 20 },
    image: { type: String, default: "https://placehold.co/640x480" },
    gallery: [{ type: String }],
    brand: { type: String, required: true, trim: true, default: "ToyKart", index: true },
    manufacturerLocation: { type: String, trim: true, default: "Dhaka, Bangladesh" },
    countryOfOrigin: { type: String, trim: true, default: "Bangladesh" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true
    },
    subcategory: { type: String, trim: true, default: "General" },
    ageGroup: {
      type: String,
      enum: ["0-2", "3-5", "6-8", "9-12", "13+"],
      default: "3-5",
      index: true
    },
    material: { type: String, trim: true, default: "Mixed" },
    safetyCertifications: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    price: { type: Number, required: true, min: 0, index: true },
    /** Optional higher “list” price for displaying discounts in the storefront */
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, enum: ["BDT"], default: "BDT" },
    countInStock: { type: Number, required: true, min: 0, default: 0 },
    colorVariants: { type: [colorVariantSchema], default: [] },
    soldCount: { type: Number, min: 0, default: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    newArrival: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
      index: true
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    dimensionsCm: { type: dimensionsSchema, default: () => ({}) },
    weightGrams: { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
);

productSchema.pre("save", function syncVariantStock(next) {
  const variants = this.colorVariants;
  if (!Array.isArray(variants) || variants.length === 0) {
    next();
    return;
  }

  let featuredIndex = variants.findIndex((v) => v.isFeatured);
  if (featuredIndex < 0) featuredIndex = 0;
  variants.forEach((v, i) => {
    v.isFeatured = i === featuredIndex;
  });

  const featured = variants[featuredIndex];
  this.countInStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  if (featured?.image) this.image = featured.image;
  if (Array.isArray(featured?.gallery) && featured.gallery.length > 0) {
    this.gallery = featured.gallery;
  }
  next();
});

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, subcategory: 1, price: 1 });
productSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });
productSchema.index({ status: 1, newArrival: -1, createdAt: -1 });
productSchema.index({ status: 1, category: 1, price: 1, createdAt: -1 });
productSchema.index({ status: 1, brand: 1, createdAt: -1 });
productSchema.index({ status: 1, ageGroup: 1, createdAt: -1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
