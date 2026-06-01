import mongoose from "mongoose";

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    note: { type: String, trim: true, default: "" },
    actorRole: { type: String, enum: ["customer", "admin", "system"], default: "system" },
    actorName: { type: String, trim: true, default: "" },
    attachments: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderType: { type: String, enum: ["ADMIN", "CUSTOMER"], required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, default: "" },
    attachments: { type: [String], default: [] },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const pickupDetailsSchema = new mongoose.Schema(
  {
    scheduledDate: { type: Date },
    courierName: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    pickupCharge: { type: Number, default: 0, min: 0 },
    pickedUpAt: { type: Date }
  },
  { _id: false }
);

const inspectionDetailsSchema = new mongoose.Schema(
  {
    condition: { type: String, enum: ["excellent", "good", "damaged", "wrong_item"], default: "good" },
    packagingStatus: { type: String, trim: true },
    accessoriesStatus: { type: String, trim: true },
    inspectionNotes: { type: String, trim: true },
    inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    inspectedAt: { type: Date }
  },
  { _id: false }
);

const refundDetailsSchema = new mongoose.Schema(
  {
    approvedAmount: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    finalRefundAmount: { type: Number, default: 0, min: 0 },
    refundMethod: { type: String, trim: true },
    transactionId: { type: String, trim: true },
    processedAt: { type: Date },
    estimatedCompletionDays: { type: Number, default: 7, min: 0 }
  },
  { _id: false }
);

const returnToCustomerDetailsSchema = new mongoose.Schema(
  {
    trackingNumber: { type: String, trim: true },
    shippingCharge: { type: Number, default: 0, min: 0 },
    returnedAt: { type: Date },
    reason: { type: String, trim: true }
  },
  { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderItem: {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: { type: String },
      qty: { type: Number, min: 1 },
      price: { type: Number, min: 0 }
    },
    requestType: {
      type: String,
      enum: ["return_refund", "refund_only", "exchange"],
      default: "return_refund",
      index: true
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "UNDER_REVIEW",
        "NEED_MORE_INFO",
        "CUSTOMER_RESPONDED",
        "APPROVED_FOR_PICKUP",
        "PICKUP_SCHEDULED",
        "PICKED_UP",
        "INSPECTION_COMPLETED",
        "REFUND_APPROVED",
        "REFUND_REJECTED",
        "REFUND_PROCESSED",
        "REPLACEMENT_APPROVED",
        "REPLACEMENT_SHIPPED",
        "REPLACEMENT_DELIVERED",
        "ITEM_RETURNED_TO_CUSTOMER",
        "COMPLETED",
        "REJECTED",
        "CLOSED"
      ],
      default: "PENDING",
      index: true
    },
    reason: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    evidenceAttachments: { type: [String], default: [] },
    refundMethod: { type: String, enum: ["BankTransfer", "bKash", "Nagad", "OriginalPaymentMethod"], default: "OriginalPaymentMethod" },
    refundAccountInfo: { type: String, trim: true },
    
    // Conversation & Notes
    conversation: { type: [messageSchema], default: [] },
    adminNotes: { type: [{ body: String, createdAt: { type: Date, default: Date.now }, createdBy: String }], default: [] },
    
    // Workflow tracking
    pickupDetails: pickupDetailsSchema,
    inspectionDetails: inspectionDetailsSchema,
    refundDetails: refundDetailsSchema,
    rejectionReason: { type: String, trim: true },
    returnToCustomerDetails: returnToCustomerDetailsSchema,
    replacementDetails: {
      replacementOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      trackingNumber: { type: String, trim: true },
      carrier: { type: String, trim: true },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
      note: { type: String, trim: true }
    },
    
    timeline: { type: [timelineEntrySchema], default: [] }
  },
  { timestamps: true }
);

returnRequestSchema.index({ order: 1, user: 1, createdAt: -1 });

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
export default ReturnRequest;
