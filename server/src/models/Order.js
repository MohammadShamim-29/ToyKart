import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    image: { type: String },
    price: { type: Number, required: true, min: 0 },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    colorName: { type: String, trim: true, default: "" },
    variantSku: { type: String, trim: true, uppercase: true, default: "" }
  },
  { _id: false }
);

const actorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String, enum: ["system", "customer", "admin"], default: "system" },
    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded"],
      default: "pending"
    },
    to: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded"],
      required: true
    },
    note: { type: String, trim: true, default: "" },
    changedBy: actorSchema,
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const adminNoteSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true },
    isPrivate: { type: Boolean, default: true },
    createdBy: actorSchema,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderItems: [orderItemSchema],
    shippingAddress: {
      firstName: { type: String, required: true, trim: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, default: "" },
      country: { type: String, required: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true, default: "" },
      orderNotes: { type: String, trim: true, default: "" }
    },
    paymentMethod: { type: String, required: true, enum: ["CashOnDelivery", "SSLCommerz"], default: "CashOnDelivery" },
    itemsPrice: { type: Number, required: true, min: 0 },
    taxPrice: { type: Number, required: true, min: 0, default: 0 },
    shippingPrice: { type: Number, required: true, min: 0, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded"],
      default: "pending"
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    paymentReference: { type: String, trim: true, default: "" },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    statusHistory: { type: [statusHistorySchema], default: [] },
    adminNotes: { type: [adminNoteSchema], default: [] },
    fulfillment: {
      carrier: { type: String, trim: true, default: "" },
      trackingNumber: { type: String, trim: true, default: "" },
      shippedAt: { type: Date }
    },
    cancelReason: { type: String, trim: true, default: "" },
    cancelledAt: { type: Date },
    cancelledBy: actorSchema,
    refund: {
      amount: { type: Number, min: 0, default: 0 },
      reason: { type: String, trim: true, default: "" },
      refundedAt: { type: Date },
      refundedBy: actorSchema,
      sslRefundRefId: { type: String, trim: true, default: "" }
    },
    // New refund management fields
    refundStatus: {
      type: String,
      enum: ["pending", "processing", "success", "failed", "none"],
      default: "none",
      index: true
    },
    refundRefId: {
      type: String,
      trim: true,
      default: "",
      index: true
    },
    refundedAt: { type: Date },
    cancellationApprovedAt: { type: Date },
    cancellationApprovedBy: actorSchema,
    returnApprovedAt: { type: Date },
    returnApprovedBy: actorSchema,
    bankTranId: {
      type: String,
      trim: true,
      default: ""
    },
    internalMemo: { type: String, trim: true, default: "" },
    customerDeletedAt: { type: Date },
    adminDeletedAt: { type: Date },
    adminDeletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
