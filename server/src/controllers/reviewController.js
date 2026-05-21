import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { syncProductRatingFromReviews } from "../utils/productRating.js";

const badRequest = (message) => {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
};

const serializeReview = (doc) => {
  const r = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: r._id,
    authorName: r.authorName,
    rating: r.rating,
    body: r.body,
    createdAt: r.createdAt
  };
};

export const getProductReviews = async (req, res) => {
  const { id: productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const product = await Product.findOne({ _id: productId, status: "active" }).select("rating numReviews");
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const reviews = await Review.find({ product: productId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const { rating, numReviews } = await syncProductRatingFromReviews(productId);

  return res.json({
    rating,
    numReviews,
    reviews: reviews.map(serializeReview)
  });
};

export const createProductReview = async (req, res) => {
  const { id: productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const product = await Product.findOne({ _id: productId, status: "active" });
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const rating = Number(req.body?.rating);
  const body = String(req.body?.body ?? "").trim();
  const authorFromBody = String(req.body?.authorName ?? req.body?.author ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw badRequest("Rating must be between 1 and 5 stars.");
  }
  if (body.length < 10) {
    throw badRequest("Review must be at least 10 characters.");
  }

  const authorName = req.user?.name?.trim() || authorFromBody;
  if (!authorName) {
    throw badRequest("Please enter your name or sign in to review.");
  }

  if (req.user?._id) {
    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) {
      return res.status(400).json({
        message: "You already reviewed this product. Edit is not available yet — contact support if needed."
      });
    }
  }

  try {
    const review = await Review.create({
      product: productId,
      user: req.user?._id,
      authorName,
      rating,
      body
    });

    const { rating: avgRating, numReviews } = await syncProductRatingFromReviews(productId);

    return res.status(201).json({
      review: serializeReview(review),
      rating: avgRating,
      numReviews
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You already reviewed this product." });
    }
    throw err;
  }
};
