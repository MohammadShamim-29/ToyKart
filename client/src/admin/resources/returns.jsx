import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List as MuiList,
  ListItem,
  Paper,
  Stack,
  TextField as MuiTextField,
  Typography
} from "@mui/material";
import {
  Datagrid,
  DateField,
  Edit,
  EditButton,
  FunctionField,
  List,
  ListActions,
  NumberInput,
  SaveButton,
  SelectInput,
  SimpleForm,
  TextInput,
  useNotify,
  useRecordContext,
  useRefresh
} from "react-admin";
import api from "../../api";
import { AdminFormPageLayout, AdminFormSection } from "../components/AdminFormChrome";
import ProcessRefundButton from "../components/ProcessRefundButton";
import ReturnRefundPanel from "../components/ReturnRefundPanel";
import RefundStatusChip from "../components/RefundStatusChip";

const statusChoices = [
  { id: "PENDING", name: "Pending" },
  { id: "UNDER_REVIEW", name: "Under Review" },
  { id: "NEED_MORE_INFO", name: "Need More Info" },
  { id: "APPROVED_FOR_PICKUP", name: "Approved for Pickup" },
  { id: "REJECTED", name: "Rejected" },
  { id: "REPLACEMENT_APPROVED", name: "Replacement Approved" },
  { id: "REPLACEMENT_SHIPPED", name: "Replacement Shipped" },
  { id: "REPLACEMENT_DELIVERED", name: "Replacement Delivered" },
  { id: "COMPLETED", name: "Completed" },
  { id: "CLOSED", name: "Closed" }
];

const STATUS_COLORS = {
  PENDING: "warning",
  UNDER_REVIEW: "info",
  NEED_MORE_INFO: "info",
  CUSTOMER_RESPONDED: "info",
  APPROVED_FOR_PICKUP: "success",
  PICKUP_SCHEDULED: "success",
  PICKED_UP: "success",
  INSPECTION_COMPLETED: "success",
  REFUND_APPROVED: "success",
  REFUND_REJECTED: "error",
  REFUND_PROCESSED: "success",
  REPLACEMENT_APPROVED: "success",
  REPLACEMENT_SHIPPED: "success",
  REPLACEMENT_DELIVERED: "success",
  ITEM_RETURNED_TO_CUSTOMER: "warning",
  COMPLETED: "success",
  REJECTED: "error",
  CLOSED: "default"
};

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const ReturnFormAside = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [statusActionBusy, setStatusActionBusy] = useState(null);

  const runAction = async (action, successMsg) => {
    if (!record?.id) return;
    setBusy(true);
    try {
      await action();
      refresh();
      notify(successMsg || "Action completed", { type: "success" });
    } catch (err) {
      notify(err.response?.data?.message || err.message || "Action failed", { type: "error" });
    } finally {
      setBusy(false);
      setStatusActionBusy(null);
    }
  };

  if (!record) return null;

  const s = record.status;

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Save updates
        </Typography>
        <SaveButton label="Save changes" variant="contained" fullWidth disabled={busy} />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Quick actions
        </Typography>
        <Stack spacing={1}>
          {s === "PENDING" && (
            <Button variant="outlined" color="info" size="small" fullWidth disabled={busy}
              onClick={() => runAction(async () => {
                await api.put(`admin/returns/${record.id}`, { status: "UNDER_REVIEW", note: "Started review" });
              }, "Now under review")}>
              Mark Under Review
            </Button>
          )}
          {["PENDING", "UNDER_REVIEW"].includes(s) && (
            <Button variant="outlined" color="warning" size="small" fullWidth disabled={busy}
              onClick={() => {
                const note = window.prompt("Reason for requesting more info:", "");
                if (!note) return;
                runAction(async () => {
                  await api.put(`admin/returns/${record.id}`, { status: "NEED_MORE_INFO", note });
                }, "Requested more information");
              }}>
              Request More Info
            </Button>
          )}
          {["PENDING", "UNDER_REVIEW", "CUSTOMER_RESPONDED"].includes(s) && (
            <Button variant="outlined" color="error" size="small" fullWidth disabled={busy}
              onClick={() => {
                const reason = window.prompt("Rejection reason:", "");
                if (!reason) return;
                runAction(async () => {
                  await api.put(`admin/returns/${record.id}`, { status: "REJECTED", note: reason });
                }, "Request rejected");
              }}>
              Reject Request
            </Button>
          )}
          {["UNDER_REVIEW", "CUSTOMER_RESPONDED"].includes(s) && (
            <Button variant="outlined" color="success" size="small" fullWidth disabled={busy}
              onClick={() => runAction(async () => {
                await api.put(`admin/returns/${record.id}`, { status: "APPROVED_FOR_PICKUP", note: "Approved for pickup" });
              }, "Approved for pickup")}>
              Approve for Pickup
            </Button>
          )}
          {s === "PICKUP_SCHEDULED" && (
            <Button variant="outlined" color="success" size="small" fullWidth disabled={busy}
              onClick={() => runAction(async () => {
                await api.post(`admin/returns/${record.id}/picked-up`);
              }, "Marked as picked up")}>
              Mark Picked Up
            </Button>
          )}
          {s === "REFUND_PROCESSED" && (
            <Button variant="outlined" color="success" size="small" fullWidth disabled={busy}
              onClick={() => runAction(async () => {
                await api.put(`admin/returns/${record.id}`, { status: "COMPLETED", note: "Request completed" });
              }, "Request completed")}>
              Mark Completed
            </Button>
          )}
          {s === "ITEM_RETURNED_TO_CUSTOMER" && (
            <Button variant="outlined" color="default" size="small" fullWidth disabled={busy}
              onClick={() => runAction(async () => {
                await api.put(`admin/returns/${record.id}`, { status: "CLOSED", note: "Request closed after item return" });
              }, "Request closed")}>
              Close Request
            </Button>
          )}
          {s === "REJECTED" && (
            <Button variant="outlined" color="default" size="small" fullWidth disabled={busy}
              onClick={() => runAction(async () => {
                await api.put(`admin/returns/${record.id}`, { status: "CLOSED", note: "Request closed after rejection" });
              }, "Request closed")}>
              Close Request
            </Button>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          On this page
        </Typography>
        <MuiList dense disablePadding>
          {[
            ["section-return-overview", "Request Details"],
            ["section-return-status", "Status"],
            ["section-return-conversation", "Conversation"],
            ["section-return-pickup", "Pickup"],
            ["section-return-inspection", "Inspection"],
            ["section-return-refund", "Refund"],
            ["section-return-replacement", "Replacement"],
            ["section-return-rejection", "Rejection / Return"],
            ["section-return-timeline", "Timeline"]
          ].map(([id, label]) => (
            <ListItem key={id} disablePadding>
              <Button onClick={() => scrollToSection(id)} sx={{ justifyContent: "flex-start", px: 0 }}>
                {label}
              </Button>
            </ListItem>
          ))}
        </MuiList>
      </Paper>
    </Stack>
  );
};

const CurrencyField = ({ value }) => {
  const fmt = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0
  });
  return <span>{fmt.format(value || 0)}</span>;
};

const ReturnConversation = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  if (!record) return null;
  const conversation = Array.isArray(record.conversation) ? record.conversation : [];

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`admin/returns/${record.id}/messages`, { text: text.trim() });
      setText("");
      notify("Message sent", { type: "success" });
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to send", { type: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Send a message to the customer. They can see and reply to all messages.
      </Typography>
      <Box sx={{ maxHeight: 300, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
        {conversation.length === 0 && (
          <Typography color="text.secondary" variant="body2">No messages yet.</Typography>
        )}
        {conversation.map((msg, idx) => (
          <Paper key={idx} variant="outlined" sx={{
            p: 1.5,
            mb: 1,
            borderRadius: 1.5,
            background: msg.senderType === "ADMIN" ? "#f0f7ff" : undefined
          }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {msg.senderType === "ADMIN" ? "Admin" : "Customer"}
              {msg.createdAt ? ` · ${new Date(msg.createdAt).toLocaleString()}` : ""}
            </Typography>
            {msg.text && <Typography variant="body2" sx={{ mt: 0.25 }}>{msg.text}</Typography>}
            {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                {msg.attachments.map((url, ai) => (
                  <a key={ai} href={url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "0.8rem", color: "#2563eb" }}>
                    Attachment {ai + 1}
                  </a>
                ))}
              </Stack>
            )}
          </Paper>
        ))}
      </Box>
      <Stack direction="row" spacing={1}>
        <MuiTextField
          size="small"
          fullWidth
          placeholder="Type your reply..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={sending}
        />
        <Button variant="contained" onClick={handleSend} disabled={sending || !text.trim()}>
          {sending ? "..." : "Send"}
        </Button>
      </Stack>
    </Stack>
  );
};

const RequestDetailsPreview = () => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <Stack spacing={1.25}>
      <Typography variant="body2"><strong>Customer:</strong> {record.user?.name || record.user?.email || "—"}</Typography>
      <Typography variant="body2"><strong>Email:</strong> {record.user?.email || "—"}</Typography>
      <Typography variant="body2"><strong>Order:</strong> #{record.order?._id?.slice(-6).toUpperCase() || "—"}</Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Order Breakdown:</strong></Typography>
      <Box sx={{ pl: 2, borderLeft: "2px solid", borderColor: "divider", mb: 0.5 }}>
        <Typography variant="body2">Product Price: <CurrencyField value={record.order?.itemsPrice} /></Typography>
        <Typography variant="body2">Shipping: <CurrencyField value={record.order?.shippingPrice} /></Typography>
        {record.order?.taxPrice > 0 && <Typography variant="body2">Tax: <CurrencyField value={record.order?.taxPrice} /></Typography>}
        <Typography variant="body2" fontWeight={700}>Total: <CurrencyField value={record.order?.totalPrice} /></Typography>
      </Box>
      <Typography variant="body2"><strong>Request Type:</strong> {record.requestType || "return_refund"}</Typography>
      <Typography variant="body2"><strong>Reason:</strong> {record.reason || "—"}</Typography>
      {record.description && <Typography variant="body2"><strong>Description:</strong> {record.description}</Typography>}
      <Typography variant="body2"><strong>Refund Method:</strong> {record.refundMethod || "OriginalPaymentMethod"}</Typography>
      {record.refundAccountInfo && <Typography variant="body2"><strong>Account Info:</strong> {record.refundAccountInfo}</Typography>}
      {Array.isArray(record.evidenceAttachments) && record.evidenceAttachments.length > 0 && (
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Evidence:</strong></Typography>
          <Stack direction="row" spacing={0.5}>
            {record.evidenceAttachments.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem" }}>
                Attachment {i + 1}
              </a>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

const ReturnTimelinePreview = () => {
  const record = useRecordContext();
  if (!record) return null;
  const timeline = Array.isArray(record.timeline) ? [...record.timeline].reverse() : [];
  return (
    <Stack spacing={1}>
      {timeline.length === 0 && <Typography color="text.secondary" variant="body2">No timeline entries.</Typography>}
      {timeline.map((entry, idx) => (
        <Paper key={idx} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
          <Typography variant="body2" fontWeight={600}>{entry.status}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
            {entry.actorName ? ` - ${entry.actorName}` : ""}
          </Typography>
          {entry.note && <Typography variant="body2" sx={{ mt: 0.5 }}>{entry.note}</Typography>}
        </Paper>
      ))}
    </Stack>
  );
};

const PickupForm = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [form, setForm] = useState({ scheduledDate: "", courierName: "", trackingNumber: "", pickupCharge: 0 });
  const [busy, setBusy] = useState(false);

  if (!record || record.status !== "APPROVED_FOR_PICKUP") {
    const p = record?.pickupDetails;
    if (!p?.courierName) return <Typography color="text.secondary" variant="body2">Not scheduled yet.</Typography>;
    return (
      <Stack spacing={0.5}>
        <Typography variant="body2"><strong>Courier:</strong> {p.courierName}</Typography>
        <Typography variant="body2"><strong>Tracking:</strong> {p.trackingNumber || "—"}</Typography>
        {p.scheduledDate && <Typography variant="body2"><strong>Scheduled:</strong> {new Date(p.scheduledDate).toLocaleString()}</Typography>}
        {p.pickupCharge !== 0 && <Typography variant="body2"><strong>Charge:</strong> <CurrencyField value={Math.abs(p.pickupCharge)} /></Typography>}
        {p.pickedUpAt && <Typography variant="body2"><strong>Picked up:</strong> {new Date(p.pickedUpAt).toLocaleString()}</Typography>}
      </Stack>
    );
  }

  const handleSchedule = async () => {
    if (!form.courierName) { notify("Courier name required", { type: "error" }); return; }
    setBusy(true);
    try {
      await api.post(`admin/returns/${record.id}/pickup`, form);
      notify("Pickup scheduled", { type: "success" });
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">Schedule courier pickup for this return.</Typography>
      <MuiTextField size="small" label="Courier Name" fullWidth value={form.courierName}
        onChange={(e) => setForm({ ...form, courierName: e.target.value })} />
      <MuiTextField size="small" label="Tracking Number" fullWidth value={form.trackingNumber}
        onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
      <MuiTextField size="small" label="Scheduled Date" type="date" fullWidth value={form.scheduledDate}
        onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
        InputLabelProps={{ shrink: true }} />
      <MuiTextField size="small" label="Pickup Charge (BDT)" type="number" fullWidth value={form.pickupCharge}
        onChange={(e) => setForm({ ...form, pickupCharge: Math.max(0, Number(e.target.value)) })} />
      <Button variant="contained" onClick={handleSchedule} disabled={busy}>
        {busy ? "Scheduling..." : "Schedule Pickup"}
      </Button>
    </Stack>
  );
};

const formatCondition = (val) => (val || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const InspectionForm = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [form, setForm] = useState({ condition: "good", packagingStatus: "", accessoriesStatus: "", inspectionNotes: "" });
  const [busy, setBusy] = useState(false);

  const conditionChoices = [
    { id: "excellent", name: "Excellent" },
    { id: "good", name: "Good" },
    { id: "damaged", name: "Damaged" },
    { id: "wrong_item", name: "Wrong Item" }
  ];

  if (!record || record.status !== "PICKED_UP") {
    const i = record?.inspectionDetails;
    if (!i?.condition) return <Typography color="text.secondary" variant="body2">Not inspected yet.</Typography>;
    return (
      <Stack spacing={0.5}>
        <Typography variant="body2"><strong>Condition:</strong> {formatCondition(i.condition)}</Typography>
        {i.packagingStatus && <Typography variant="body2"><strong>Packaging:</strong> {i.packagingStatus}</Typography>}
        {i.accessoriesStatus && <Typography variant="body2"><strong>Accessories:</strong> {i.accessoriesStatus}</Typography>}
        {i.inspectionNotes && <Typography variant="body2"><strong>Notes:</strong> {i.inspectionNotes}</Typography>}
      </Stack>
    );
  }

  const handleRecord = async () => {
    setBusy(true);
    try {
      await api.post(`admin/returns/${record.id}/inspection`, form);
      notify("Inspection recorded", { type: "success" });
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">Record warehouse inspection results.</Typography>
      <MuiTextField size="small" label="Condition" select fullWidth value={form.condition}
        onChange={(e) => setForm({ ...form, condition: e.target.value })}
        SelectProps={{ native: true }}>
        {conditionChoices.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </MuiTextField>
      <MuiTextField size="small" label="Packaging Status" fullWidth value={form.packagingStatus}
        onChange={(e) => setForm({ ...form, packagingStatus: e.target.value })} />
      <MuiTextField size="small" label="Accessories Status" fullWidth value={form.accessoriesStatus}
        onChange={(e) => setForm({ ...form, accessoriesStatus: e.target.value })} />
      <MuiTextField size="small" label="Inspection Notes" fullWidth multiline minRows={2} value={form.inspectionNotes}
        onChange={(e) => setForm({ ...form, inspectionNotes: e.target.value })} />
      <Button variant="contained" onClick={handleRecord} disabled={busy}>
        {busy ? "Recording..." : "Record Inspection"}
      </Button>
    </Stack>
  );
};

const RefundApproveForm = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [form, setForm] = useState({ approvedAmount: record?.order?.totalPrice || 0, deductions: 0, finalRefundAmount: record?.order?.totalPrice || 0, refundMethod: "OriginalPaymentMethod" });
  const [busy, setBusy] = useState(false);

  if (!record || record.status !== "INSPECTION_COMPLETED") {
    const r = record?.refundDetails;
    if (!r?.finalRefundAmount) return <Typography color="text.secondary" variant="body2">Not processed yet.</Typography>;
    return (
      <Stack spacing={0.5}>
        <Typography variant="body2"><strong>Approved:</strong> <CurrencyField value={r.approvedAmount} /></Typography>
        <Typography variant="body2"><strong>Deductions:</strong> <CurrencyField value={r.deductions} /></Typography>
        <Typography variant="body2"><strong>Final Amount:</strong> <CurrencyField value={r.finalRefundAmount} /></Typography>
        <Typography variant="body2"><strong>Method:</strong> {r.refundMethod || "—"}</Typography>
        {r.transactionId && <Typography variant="body2"><strong>Transaction ID:</strong> {r.transactionId}</Typography>}
        {r.processedAt && <Typography variant="body2"><strong>Processed:</strong> {new Date(r.processedAt).toLocaleString()}</Typography>}
      </Stack>
    );
  }

  const updateFinal = (approved, deduct) => {
    const a = Number(approved) || 0;
    const d = Number(deduct) || 0;
    return Math.max(0, a - d);
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      await api.post(`admin/returns/${record.id}/approve-refund`, {
        ...form,
        approvedAmount: Number(form.approvedAmount),
        deductions: Number(form.deductions),
        finalRefundAmount: updateFinal(form.approvedAmount, form.deductions)
      });
      notify("Refund approved", { type: "success" });
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">Approve refund after successful inspection.</Typography>
      <MuiTextField size="small" label="Approved Amount (BDT)" type="number" fullWidth value={form.approvedAmount}
        onChange={(e) => {
          const v = e.target.value;
          setForm({ ...form, approvedAmount: v, finalRefundAmount: updateFinal(v, form.deductions) });
        }} />
      <MuiTextField size="small" label="Deductions (BDT)" type="number" fullWidth value={form.deductions}
        onChange={(e) => {
          const v = e.target.value;
          setForm({ ...form, deductions: v, finalRefundAmount: updateFinal(form.approvedAmount, v) });
        }} />
      <MuiTextField size="small" label="Final Refund Amount" type="number" fullWidth
        value={updateFinal(form.approvedAmount, form.deductions)} InputProps={{ readOnly: true }}
        sx={{ "& .MuiInputBase-input.Mui-readOnly": { background: "#f9fafb" } }} />
      <Button variant="contained" color="success" onClick={handleApprove} disabled={busy}>
        {busy ? "Approving..." : "Approve Refund"}
      </Button>
    </Stack>
  );
};

const RefundRejectForm = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (!record || record.status !== "INSPECTION_COMPLETED") return null;

  const handleReject = async () => {
    if (!reason.trim()) { notify("Rejection reason is required", { type: "error" }); return; }
    setBusy(true);
    try {
      await api.post(`admin/returns/${record.id}/reject-refund`, { rejectionReason: reason });
      notify("Refund rejected", { type: "success" });
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      <Divider />
      <Typography variant="subtitle2" fontWeight={600} color="error">Reject Refund</Typography>
      <MuiTextField size="small" label="Rejection Reason" fullWidth multiline minRows={2} value={reason}
        onChange={(e) => setReason(e.target.value)} />
      <Button variant="outlined" color="error" onClick={handleReject} disabled={busy}>
        {busy ? "Rejecting..." : "Reject Refund"}
      </Button>
    </Stack>
  );
};

const ReturnToCustomerForm = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [form, setForm] = useState({ trackingNumber: "", shippingCharge: 0, reason: "" });
  const [busy, setBusy] = useState(false);

  if (!record || record.status !== "REFUND_REJECTED") {
    const r = record?.returnToCustomerDetails;
    if (!r?.trackingNumber) return null;
    return (
      <Stack spacing={0.5}>
        <Typography variant="body2"><strong>Tracking:</strong> {r.trackingNumber}</Typography>
        {r.shippingCharge > 0 && <Typography variant="body2"><strong>Charge:</strong> <CurrencyField value={r.shippingCharge} /></Typography>}
        {r.returnedAt && <Typography variant="body2"><strong>Returned:</strong> {new Date(r.returnedAt).toLocaleString()}</Typography>}
      </Stack>
    );
  }

  const handleReturn = async () => {
    if (!form.trackingNumber.trim()) { notify("Tracking number required", { type: "error" }); return; }
    setBusy(true);
    try {
      await api.post(`admin/returns/${record.id}/return-to-customer`, form);
      notify("Item return recorded", { type: "success" });
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Record return shipment details for the rejected item.
      </Typography>
      <MuiTextField size="small" label="Tracking Number" fullWidth value={form.trackingNumber}
        onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
      <MuiTextField size="small" label="Shipping Charge (BDT)" type="number" fullWidth value={form.shippingCharge}
        onChange={(e) => setForm({ ...form, shippingCharge: Number(e.target.value) })} />
      <MuiTextField size="small" label="Reason" fullWidth value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      <Button variant="contained" onClick={handleReturn} disabled={busy}>
        {busy ? "Recording..." : "Record Return to Customer"}
      </Button>
    </Stack>
  );
};

const RejectionReasonDisplay = () => {
  const record = useRecordContext();
  if (!record?.rejectionReason) return null;
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, mt: 1, background: "#fef2f2" }}>
      <Typography variant="body2" color="error"><strong>Rejection Reason:</strong> {record.rejectionReason}</Typography>
    </Paper>
  );
};

const ReplacementForm = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [shippingForm, setShippingForm] = useState({ trackingNumber: "", carrier: "", note: "" });
  const [busy, setBusy] = useState(false);

  const replacementOrderId = record?.replacementDetails?.replacementOrder?._id || record?.replacementDetails?.replacementOrder;
  const isShipped = record?.status === "REPLACEMENT_SHIPPED";
  const isDelivered = record?.status === "REPLACEMENT_DELIVERED";

  // Not yet inspected, or condition doesn't qualify for replacement
  if (!record || record.status === "PENDING") return null;

  const canApprove = record.status === "INSPECTION_COMPLETED";
  const canMarkShipped = record.status === "REPLACEMENT_APPROVED";
  const canMarkDelivered = record.status === "REPLACEMENT_SHIPPED";

  if (!canApprove && !canMarkShipped && !canMarkDelivered && !isDelivered) {
    // Show replacement order link if one exists
    const rd = record?.replacementDetails;
    if (rd?.replacementOrder) {
      const orderLabel = `#${String(replacementOrderId).slice(-6).toUpperCase()}`;
      return (
        <Stack spacing={0.5}>
          <Typography variant="body2"><strong>Replacement Order:</strong> {orderLabel}</Typography>
          {rd.trackingNumber && <Typography variant="body2"><strong>Tracking:</strong> {rd.trackingNumber}</Typography>}
          {rd.carrier && <Typography variant="body2"><strong>Carrier:</strong> {rd.carrier}</Typography>}
          {rd.shippedAt && <Typography variant="body2"><strong>Shipped:</strong> {new Date(rd.shippedAt).toLocaleString()}</Typography>}
          {rd.deliveredAt && <Typography variant="body2"><strong>Delivered:</strong> {new Date(rd.deliveredAt).toLocaleString()}</Typography>}
        </Stack>
      );
    }
    return null;
  }

  const handleApprove = async () => {
    setBusy(true);
    try {
      await api.post(`admin/returns/${record.id}/approve-replacement`);
      notify("Replacement approved", { type: "success" });
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to approve replacement", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleMarkShipped = async () => {
    if (!shippingForm.trackingNumber.trim()) {
      notify("Tracking number required", { type: "error" });
      return;
    }
    setBusy(true);
    try {
      await api.post(`admin/returns/${record.id}/replacement-shipped`, shippingForm);
      notify("Replacement marked as shipped", { type: "success" });
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleMarkDelivered = async () => {
    setBusy(true);
    try {
      await api.post(`admin/returns/${record.id}/replacement-delivered`);
      notify("Replacement marked as delivered", { type: "success" });
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      {canApprove && (
        <>
          <Typography variant="body2" color="text.secondary">
            The item was marked as <strong>{formatCondition(record.inspectionDetails?.condition)}</strong>.
            Approve a free replacement (no shipping charge).
          </Typography>
          <Button variant="contained" color="success" onClick={handleApprove} disabled={busy}>
            {busy ? "Approving..." : "Approve Free Replacement"}
          </Button>
        </>
      )}

      {canMarkShipped && (
        <>
          <Typography variant="body2" color="text.secondary">
            Replacement order created. Enter shipping details to mark as shipped.
          </Typography>
          <MuiTextField size="small" label="Tracking Number" fullWidth value={shippingForm.trackingNumber}
            onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })} />
          <MuiTextField size="small" label="Carrier" fullWidth value={shippingForm.carrier}
            onChange={(e) => setShippingForm({ ...shippingForm, carrier: e.target.value })} />
          <MuiTextField size="small" label="Note" fullWidth value={shippingForm.note}
            onChange={(e) => setShippingForm({ ...shippingForm, note: e.target.value })} />
          <Button variant="contained" onClick={handleMarkShipped} disabled={busy}>
            {busy ? "Saving..." : "Mark as Shipped"}
          </Button>
        </>
      )}

      {canMarkDelivered && (
        <>
          <Typography variant="body2" color="text.secondary">
            Replacement has been shipped. Mark as delivered when the customer receives it.
          </Typography>
          <Button variant="contained" color="success" onClick={handleMarkDelivered} disabled={busy}>
            {busy ? "Updating..." : "Mark as Delivered"}
          </Button>
        </>
      )}

      {isDelivered && (
        <Typography variant="body2" color="text.secondary">
          Replacement delivered to customer.
        </Typography>
      )}
    </Stack>
  );
};

const statusChip = (status) => {
  const color = STATUS_COLORS[status] || "default";
  const label = statusChoices.find((c) => c.id === status)?.name || status;
  return <Chip size="small" variant="outlined" label={label} color={color} />;
};

const ReturnFormFields = () => (
  <AdminFormPageLayout hint="Manage the full return lifecycle from review through refund or rejection." hintTitle="Return operations" aside={<ReturnFormAside />}>
    <AdminFormSection sectionId="section-return-overview" title="Request Details" description="Customer and order information.">
      <RequestDetailsPreview />
    </AdminFormSection>

    <AdminFormSection sectionId="section-return-status" title="Status" description="Update the current status of this request.">
      <SelectInput source="status" choices={statusChoices} fullWidth />
      <TextInput source="note" label="Status Change Note" fullWidth multiline minRows={2} helperText="Visible to customer in timeline" />
      <TextInput source="adminNote" label="Internal Note" fullWidth multiline minRows={2} />
    </AdminFormSection>

    <AdminFormSection sectionId="section-return-conversation" title="Conversation" description="Communicate with the customer about this request.">
      <ReturnConversation />
    </AdminFormSection>

    <AdminFormSection sectionId="section-return-pickup" title="Pickup" description="Schedule and manage courier pickup.">
      <PickupForm />
    </AdminFormSection>

    <AdminFormSection sectionId="section-return-inspection" title="Inspection" description="Record warehouse inspection results.">
      <InspectionForm />
    </AdminFormSection>

    <AdminFormSection sectionId="section-return-refund" title="Refund" description="Approve, reject, and process refunds.">
      <RefundApproveForm />
      <RefundRejectForm />
      <ReturnRefundPanel />
    </AdminFormSection>

    <AdminFormSection sectionId="section-return-replacement" title="Replacement" description="Free replacement for damaged or wrong items.">
      <ReplacementForm />
    </AdminFormSection>

    <AdminFormSection sectionId="section-return-rejection" title="Rejection / Return to Customer" description="Handle rejection and item return.">
      <ReturnToCustomerForm />
      <RejectionReasonDisplay />
    </AdminFormSection>

    <AdminFormSection sectionId="section-return-timeline" title="Timeline" description="Full activity history for this request.">
      <ReturnTimelinePreview />
    </AdminFormSection>
  </AdminFormPageLayout>
);

export const ReturnRequestList = () => (
  <List
    actions={<ListActions />}
    perPage={25}
    sort={{ field: "createdAt", order: "DESC" }}
    filters={[
      <TextInput key="q" source="q" label="Search" alwaysOn resettable />,
      <SelectInput key="status" source="status" choices={statusChoices} alwaysOn />
    ]}
  >
    <Datagrid rowClick="edit">
      <FunctionField label="Order" render={(record) => `#${String(record.order?._id || "").slice(-6).toUpperCase()}`} />
      <FunctionField label="Customer" render={(record) => record.user?.name || record.user?.email || "—"} />
      <FunctionField label="Type" render={(record) => record.requestType || "return_refund"} />
      <FunctionField label="Status" render={(record) => statusChip(record.status)} />
      <FunctionField
        label="Transaction ID"
        render={(record) => 
          record.order?.paymentMethod === "SSLCommerz" && record.order?.bankTranId
            ? <Chip label={record.order.bankTranId} size="small" variant="outlined" />
            : "—"
        }
      />
      <FunctionField
        label="Refund Status"
        render={(record) => (
          <RefundStatusChip
            refund={{ status: record.order?.refundStatus, refundRefId: record.order?.refundRefId }}
            order={record.order}
            returnRequest={record}
          />
        )}
      />
      <DateField source="createdAt" label="Date" showTime />
      <FunctionField
        label="Actions"
        render={(record) => <ReturnRowActions record={record} />}
      />
      <EditButton />
    </Datagrid>
  </List>
);

const ReturnRowActions = ({ record }) => {
  const refresh = useRefresh();
  const order = record.order;
  const finalAmount = Number(record.refundDetails?.finalRefundAmount ?? order?.totalPrice ?? 0);

  const orderId = order?.id || order?._id;
  if (record.status !== "REFUND_APPROVED" || !orderId) return null;
  if (order.paymentMethod !== "SSLCommerz" || !order.isPaid || order.refundStatus === "success") {
    return null;
  }

  return (
    <ProcessRefundButton
      orderId={orderId}
      order={order}
      returnRequest={record}
      refundAmount={finalAmount}
      sourceType="return"
      onSuccess={() => refresh()}
      size="small"
      variant="outlined"
    />
  );
};

export const ReturnRequestEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={false}>
      <ReturnFormFields />
    </SimpleForm>
  </Edit>
);
