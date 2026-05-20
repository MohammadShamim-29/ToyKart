import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    refundRequestId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    transactionId: {
      type: String,
      required: true,
      trim: true
    },
    bankTranId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0
    },
    refundRemarks: {
      type: String,
      trim: true,
      default: "Refund approved by admin"
    },
    refundRefId: {
      type: String,
      trim: true,
      index: true
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ["pending", "processing", "success", "failed"],
      default: "pending",
      index: true
    },
    sourceType: {
      type: String,
      enum: ["cancellation", "return"],
      required: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    approvedAt: {
      type: Date
    },
    processedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    failureReason: {
      type: String,
      trim: true
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastRetryAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Index for querying refunds by order and status
refundSchema.index({ orderId: 1, status: 1 });
refundSchema.index({ userId: 1, status: 1 });
refundSchema.index({ createdAt: -1 });

const Refund = mongoose.model("Refund", refundSchema);
export default Refund;
