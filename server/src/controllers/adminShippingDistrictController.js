import mongoose from "mongoose";
import ShippingCountry from "../models/ShippingCountry.js";
import ShippingDistrict from "../models/ShippingDistrict.js";

function districtIdFromParams(req, res) {
  const raw = req.params.id;
  if (raw == null || String(raw).trim() === "" || String(raw) === "[object Object]") {
    res.status(400).json({ message: "Invalid district id" });
    return null;
  }
  const id = String(raw).trim();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid district id" });
    return null;
  }
  return id;
}

const coerceCountryId = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    if (value._id != null) return String(value._id).trim();
    if (value.id != null) return String(value.id).trim();
  }
  return "";
};

async function assertCountryExists(countryId) {
  if (!mongoose.Types.ObjectId.isValid(countryId)) {
    return { error: "Invalid country id" };
  }
  const country = await ShippingCountry.findById(countryId);
  if (!country) {
    return { error: "Country not found" };
  }
  return { country };
}

export const listAdminShippingDistricts = async (req, res) => {
  const query = {};
  if (req.query.country) {
    query.country = req.query.country;
  }
  const districts = await ShippingDistrict.find(query)
    .populate("country", "name isoCode isEnabled")
    .sort({ sortOrder: 1, name: 1 });
  return res.json(districts);
};

export const getAdminShippingDistrict = async (req, res) => {
  const id = districtIdFromParams(req, res);
  if (!id) return;

  const district = await ShippingDistrict.findById(id).populate("country", "name isoCode isEnabled");
  if (!district) {
    return res.status(404).json({ message: "District not found" });
  }
  return res.json(district);
};

export const createAdminShippingDistrict = async (req, res) => {
  const { name, country, isEnabled, sortOrder } = req.body;
  const countryId = coerceCountryId(country);

  if (!name?.trim()) {
    return res.status(400).json({ message: "District name is required" });
  }
  if (!countryId) {
    return res.status(400).json({ message: "Country is required" });
  }

  const countryCheck = await assertCountryExists(countryId);
  if (countryCheck.error) {
    return res.status(400).json({ message: countryCheck.error });
  }

  try {
    const district = await ShippingDistrict.create({
      name: String(name).trim(),
      country: countryCheck.country._id,
      isEnabled: isEnabled !== false,
      sortOrder: Number(sortOrder) || 0
    });
    await district.populate("country", "name isoCode isEnabled");
    return res.status(201).json(district);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "District already exists in that country" });
    }
    throw err;
  }
};

export const updateAdminShippingDistrict = async (req, res) => {
  const id = districtIdFromParams(req, res);
  if (!id) return;

  const district = await ShippingDistrict.findById(id);
  if (!district) {
    return res.status(404).json({ message: "District not found" });
  }

  const { name, country, isEnabled, sortOrder } = req.body;
  if (name !== undefined) {
    district.name = String(name).trim();
  }
  if (country !== undefined) {
    const countryId = coerceCountryId(country);
    const countryCheck = await assertCountryExists(countryId);
    if (countryCheck.error) {
      return res.status(400).json({ message: countryCheck.error });
    }
    district.country = countryCheck.country._id;
  }
  if (isEnabled !== undefined) {
    district.isEnabled = Boolean(isEnabled);
  }
  if (sortOrder !== undefined) {
    district.sortOrder = Number(sortOrder) || 0;
  }

  try {
    await district.save();
    await district.populate("country", "name isoCode isEnabled");
    return res.json(district);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "District already exists in that country" });
    }
    throw err;
  }
};

export const deleteAdminShippingDistrict = async (req, res) => {
  const id = districtIdFromParams(req, res);
  if (!id) return;

  const district = await ShippingDistrict.findByIdAndDelete(id);
  if (!district) {
    return res.status(404).json({ message: "District not found" });
  }
  return res.json({ message: "District removed", district });
};
