import mongoose from "mongoose";

const shippingDistrictSchema = new mongoose.Schema(
  {
    country: { type: mongoose.Schema.Types.ObjectId, ref: "ShippingCountry", required: true, index: true },
    name: { type: String, required: true, trim: true },
    isEnabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

shippingDistrictSchema.index({ country: 1, name: 1 }, { unique: true });

const ShippingDistrict = mongoose.model("ShippingDistrict", shippingDistrictSchema);
export default ShippingDistrict;
