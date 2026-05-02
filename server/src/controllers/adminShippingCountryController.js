import mongoose from "mongoose";
import ShippingCountry from "../models/ShippingCountry.js";
import ShippingDistrict from "../models/ShippingDistrict.js";

const normalizeIsoCode = (value) => {
  if (value == null) return "";
  return String(value).trim().toUpperCase();
};

function countryIdFromParams(req, res) {
  const raw = req.params.id;
  if (raw == null || String(raw).trim() === "" || String(raw) === "[object Object]") {
    res.status(400).json({ message: "Invalid country id" });
    return null;
  }
  const id = String(raw).trim();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid country id" });
    return null;
  }
  return id;
}

export const listAdminShippingCountries = async (req, res) => {
  const countries = await ShippingCountry.find().sort({ sortOrder: 1, name: 1 });
  return res.json(countries);
};

export const getAdminShippingCountry = async (req, res) => {
  const id = countryIdFromParams(req, res);
  if (!id) return;

  const country = await ShippingCountry.findById(id);
  if (!country) {
    return res.status(404).json({ message: "Country not found" });
  }
  return res.json(country);
};

export const createAdminShippingCountry = async (req, res) => {
  const { name, isoCode, isEnabled, sortOrder } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ message: "Country name is required" });
  }

  try {
    const country = await ShippingCountry.create({
      name: String(name).trim(),
      isoCode: normalizeIsoCode(isoCode),
      isEnabled: isEnabled !== false,
      sortOrder: Number(sortOrder) || 0
    });
    return res.status(201).json(country);
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern?.isoCode) {
        return res.status(400).json({ message: "ISO code already exists" });
      }
      return res.status(400).json({ message: "Country name already exists" });
    }
    throw err;
  }
};

export const updateAdminShippingCountry = async (req, res) => {
  const id = countryIdFromParams(req, res);
  if (!id) return;

  const country = await ShippingCountry.findById(id);
  if (!country) {
    return res.status(404).json({ message: "Country not found" });
  }

  const { name, isoCode, isEnabled, sortOrder } = req.body;
  if (name !== undefined) {
    country.name = String(name).trim();
  }
  if (isoCode !== undefined) {
    country.isoCode = normalizeIsoCode(isoCode);
  }
  if (isEnabled !== undefined) {
    country.isEnabled = Boolean(isEnabled);
  }
  if (sortOrder !== undefined) {
    country.sortOrder = Number(sortOrder) || 0;
  }

  try {
    await country.save();
    return res.json(country);
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern?.isoCode) {
        return res.status(400).json({ message: "ISO code already exists" });
      }
      return res.status(400).json({ message: "Country name already exists" });
    }
    throw err;
  }
};

export const deleteAdminShippingCountry = async (req, res) => {
  const id = countryIdFromParams(req, res);
  if (!id) return;

  const country = await ShippingCountry.findByIdAndDelete(id);
  if (!country) {
    return res.status(404).json({ message: "Country not found" });
  }

  await ShippingDistrict.deleteMany({ country: country._id });
  return res.json({ message: "Country removed", country });
};
