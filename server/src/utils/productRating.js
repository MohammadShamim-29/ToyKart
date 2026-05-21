import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";

export function toProductObjectId(productId) {
  const id = String(productId ?? "").trim();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

export async function syncProductRatingFromReviews(productId) {
  const oid = toProductObjectId(productId);
  if (!oid) return { rating: 0, numReviews: 0 };

  const [stats] = await Review.aggregate([
    { $match: { product: oid } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 }
      }
    }
  ]);

  const numReviews = stats?.count ?? 0;
  const rating =
    numReviews > 0 ? Math.round((Number(stats.avgRating) || 0) * 10) / 10 : 0;

  await Product.findByIdAndUpdate(oid, { rating, numReviews });
  return { rating, numReviews };
}
