import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    description: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;
