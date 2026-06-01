import mongoose from "mongoose";

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: `Invalid ${err.path === "_id" ? "id" : err.path || "value"}`
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const first = Object.values(err.errors || {})[0];
    return res.status(400).json({
      message: first?.message || err.message || "Validation failed",
      errors: Object.fromEntries(
        Object.entries(err.errors || {}).map(([key, value]) => [key, value?.message || "Invalid value"])
      )
    });
  }

  const statusCode =
    err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    message: err.message || "Server error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};
