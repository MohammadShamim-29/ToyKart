import mongoose from "mongoose";

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["requested", "under_review", "approved", "rejected", "more_info_required"],
      required: true
    },
    note: { type: String, trim: true, default: "" },
    actorRole: { type: String, enum: ["customer", "admin", "system"], default: "system" },
    actorName: { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const returnItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, trim: true, default: "" },
    qty: { type: Number, min: 1, default: 1 },
    reason: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requestType: {
      type: String,
      enum: ["return_refund", "refund_only", "exchange"],
      default: "return_refund",
      index: true
    },
    status: {
      type: String,
      enum: ["requested", "under_review", "approved", "rejected", "more_info_required"],
      default: "requested",
      index: true
    },
    customerReason: { type: String, required: true, trim: true, maxlength: 1000 },
    items: { type: [returnItemSchema], default: [] },
    adminDecisionNote: { type: String, trim: true, default: "" },
    timeline: { type: [timelineEntrySchema], default: [] }
  },
  { timestamps: true }
);

returnRequestSchema.index({ order: 1, user: 1, createdAt: -1 });

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
export default ReturnRequest;
