import mongoose from "mongoose";
import ReturnRequest from "../models/ReturnRequest.js";

const asTrimmed = (v) => String(v ?? "").trim();

const allowedStatuses = new Set(["requested", "under_review", "approved", "rejected", "more_info_required"]);

const mapRecord = (doc) => {
  const obj = typeof doc.toObject === "function" ? doc.toObject({ virtuals: false }) : doc;
  return { ...obj, id: String(obj._id) };
};

export const listAdminReturnRequests = async (req, res) => {
  const rows = await ReturnRequest.find()
    .populate("order", "_id totalPrice status createdAt")
    .populate("user", "name email")
    .sort({ createdAt: -1 });
  return res.json(rows.map((r) => mapRecord(r)));
};

export const getAdminReturnRequest = async (req, res) => {
  const id = asTrimmed(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid return request id" });
  }

  const row = await ReturnRequest.findById(id)
    .populate("order", "_id totalPrice status createdAt")
    .populate("user", "name email");
  if (!row) return res.status(404).json({ message: "Return request not found" });
  return res.json(mapRecord(row));
};

export const updateAdminReturnRequest = async (req, res) => {
  const id = asTrimmed(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid return request id" });
  }

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  const nextStatus = asTrimmed(req.body?.status).toLowerCase();
  const note = asTrimmed(req.body?.adminDecisionNote || req.body?.note);

  if (nextStatus) {
    if (!allowedStatuses.has(nextStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    row.status = nextStatus;
    row.timeline.push({
      status: nextStatus,
      note: note || `Status updated to ${nextStatus}`,
      actorRole: "admin",
      actorName: req.user?.name || req.user?.email || "Admin",
      createdAt: new Date()
    });
  }

  if (note) {
    row.adminDecisionNote = note;
  }

  await row.save();
  await row.populate("order", "_id totalPrice status createdAt");
  await row.populate("user", "name email");
  return res.json(mapRecord(row));
};
