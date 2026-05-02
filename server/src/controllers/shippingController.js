import ShippingCountry from "../models/ShippingCountry.js";
import ShippingDistrict from "../models/ShippingDistrict.js";

/**
 * Public endpoint for checkout location dropdowns.
 * Only returns enabled countries that have at least one enabled district.
 */
export const listCheckoutShippingLocations = async (req, res) => {
  const countries = await ShippingCountry.find({ isEnabled: true }).sort({ sortOrder: 1, name: 1 }).lean();
  if (!countries.length) {
    return res.json([]);
  }

  const countryIds = countries.map((country) => country._id);
  const districts = await ShippingDistrict.find({
    country: { $in: countryIds },
    isEnabled: true
  })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const districtMap = new Map();
  for (const district of districts) {
    const key = String(district.country);
    const list = districtMap.get(key) || [];
    list.push({ id: district._id, name: district.name });
    districtMap.set(key, list);
  }

  const payload = countries
    .map((country) => ({
      id: country._id,
      name: country.name,
      isoCode: country.isoCode || "",
      districts: districtMap.get(String(country._id)) || []
    }))
    .filter((country) => country.districts.length > 0);

  return res.json(payload);
};
