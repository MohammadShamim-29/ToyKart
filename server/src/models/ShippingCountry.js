import mongoose from "mongoose";

const shippingCountrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isoCode: { type: String, trim: true, uppercase: true, default: "" },
    isEnabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

shippingCountrySchema.index({ name: 1 }, { unique: true });
shippingCountrySchema.index({ isoCode: 1 }, { unique: true, sparse: true });

const ShippingCountry = mongoose.model("ShippingCountry", shippingCountrySchema);
export default ShippingCountry;
