import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  List as MuiList,
  ListItem,
  Paper,
  Stack,
  TextField as MuiTextField,
  Typography
} from "@mui/material";
import { useRecordContext } from "react-admin";
import {
  BooleanInput,
  Datagrid,
  DateField,
  Edit,
  EditButton,
  FunctionField,
  List,
  ListActions,
  NumberField,
  NumberInput,
  SaveButton,
  SelectInput,
  SimpleForm,
  TextInput,
  useNotify,
  useRefresh
} from "react-admin";
import api from "../../api";
import refundAPI from "../../api/refundAPI";
import { AdminFormPageLayout, AdminFormSection } from "../components/AdminFormChrome";
import ProcessRefundButton from "../components/ProcessRefundButton";
import RefundStatusChip from "../components/RefundStatusChip";
import ApproveCancellationButton from "../components/ApproveCancellationButton";
import { FileDown } from "lucide-react";

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0
});

const statusChip = (status) => {
  const s = String(status || "cancelled");
  const color = s === "refunded" ? "warning" : "error";
  return <Chip size="small" variant="outlined" label={s.charAt(0).toUpperCase() + s.slice(1)} color={color} />;
};

const paymentChip = (paymentStatus) => {
  const p = String(paymentStatus || "pending");
  const color = p === "paid" ? "success" : p === "refunded" ? "warning" : "default";
  return <Chip size="small" variant="outlined" label={p.charAt(0).toUpperCase() + p.slice(1)} color={color} />;
};

const titleFromOrder = ({ record }) =>
  `Order #${record?.orderNumber || String(record?.id || "").slice(-8).toUpperCase()}`;

const CancelledOrderActions = ({ record }) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);

  const processRefund = async () => {
    if (!record?.id) return;
    const amount = window.prompt("Enter refund amount (BDT):", String(record?.totalPrice || ""));
    if (!amount || Number(amount) <= 0) return;
    const reason = window.prompt("Refund reason (optional):", "Order cancelled - customer refund");
    setBusy(true);
    try {
      await api.patch(`admin/orders/${record.id}/refund`, {
        amount: Number(amount),
        reason: reason || ""
        // sslTransactionId is optional - system will use stored paymentReference if not provided
      });
      notify("Refund processed successfully", { type: "success" });
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Refund failed", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (record?.paymentStatus === "refunded") return null;

  return (
    <Button
      variant="contained"
      color="warning"
      size="small"
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        processRefund();
      }}
    >
      Refund
    </Button>
  );
};

export const CancelledOrderList = () => (
  <List
    actions={<ListActions />}
    perPage={25}
    sort={{ field: "createdAt", order: "DESC" }}
    filters={[
      <TextInput key="q" source="q" label="Search" alwaysOn resettable />,
      <SelectInput key="paymentStatus" source="paymentStatus" label="Payment" choices={[
        { id: "pending", name: "Pending" },
        { id: "paid", name: "Paid" },
        { id: "refunded", name: "Refunded" }
      ]} alwaysOn />
    ]}
  >
    <Datagrid rowClick="edit">
      <FunctionField
        label="Order"
        render={(record) =>
          `#${record.orderNumber || String(record.id || "").slice(-8).toUpperCase()}`
        }
      />
      <FunctionField
        label="Customer"
        render={(record) => record.customerName || record.user?.name || "Customer"}
      />
      <FunctionField label="Status" render={(record) => statusChip(record.status)} />
      <FunctionField label="Payment" render={(record) => paymentChip(record.paymentStatus)} />
      <FunctionField label="Cancel reason" render={(record) => record.cancelReason || "—"} />
      <FunctionField
        label="Transaction ID"
        render={(record) => 
          record.paymentMethod === "SSLCommerz" && record.bankTranId
            ? <Chip label={record.bankTranId} size="small" variant="outlined" />
            : "—"
        }
      />
      <FunctionField
        label="Refund Status"
        render={(record) => <RefundStatusChip refund={{ status: record.refundStatus, refundRefId: record.refundRefId }} order={record} />}
      />
      <NumberField
        source="totalPrice"
        label="Total"
        options={{ style: "currency", currency: "BDT", maximumFractionDigits: 0 }}
      />
      <DateField source="cancelledAt" label="Cancelled" showTime />
      <FunctionField
        label="Actions"
        render={(record) => <CancelledOrderRowActions record={record} />}
      />
      <EditButton />
    </Datagrid>
  </List>
);

const CancelledOrderRowActions = ({ record }) => {
  const refresh = useRefresh();
  const notify = useNotify();
  const [loading, setLoading] = useState(false);

  const handleRefundSuccess = () => {
    refresh();
  };

  return (
    <Stack direction="row" spacing={1}>
      <ApproveCancellationButton
        orderId={record.id}
        order={record}
        onSuccess={handleRefundSuccess}
        size="small"
        variant="outlined"
      />
      <ProcessRefundButton
        orderId={record.id}
        order={record}
        onSuccess={handleRefundSuccess}
        size="small"
        variant="outlined"
      />
    </Stack>
  );
};

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const CancelRefundInfo = () => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <>
      <MuiTextField
        label="Cancel reason"
        value={record.cancelReason || "—"}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
      />
      <MuiTextField
        label="Cancelled at"
        value={record.cancelledAt ? new Date(record.cancelledAt).toLocaleString() : "—"}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
      />
      <Divider />
      <Typography variant="subtitle2" fontWeight={600}>
        Refund info
      </Typography>
      <MuiTextField
        label="Refund amount"
        value={record.refund?.amount ? currency.format(record.refund.amount) : "No refund processed"}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
      />
      {record.refund?.reason ? (
        <MuiTextField
          label="Refund reason"
          value={record.refund.reason}
          fullWidth
          slotProps={{ input: { readOnly: true } }}
        />
      ) : null}
      {record.refund?.refundedAt ? (
        <MuiTextField
          label="Refunded at"
          value={new Date(record.refund.refundedAt).toLocaleString()}
          fullWidth
          slotProps={{ input: { readOnly: true } }}
        />
      ) : null}
      {record.refund?.sslRefundRefId ? (
        <MuiTextField
          label="SSL Refund Ref ID"
          value={record.refund.sslRefundRefId}
          fullWidth
          slotProps={{ input: { readOnly: true } }}
        />
      ) : null}
    </>
  );
};

const OrderItemsPreview = () => {
  const record = useRecordContext();
  const items = Array.isArray(record?.orderItems) ? record.orderItems : [];

  if (!items.length) {
    return <Typography color="text.secondary">No line items on this order.</Typography>;
  }

  return (
    <Stack spacing={1.25}>
      {items.map((item, idx) => (
        <Paper
          key={`${item.product?._id || item.product || idx}-${idx}`}
          variant="outlined"
          sx={{ p: 1.5, borderRadius: 1.5 }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography fontWeight={600}>{item.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Qty {item.qty} x {currency.format(item.price || 0)}
              </Typography>
            </Box>
            <Typography fontWeight={700}>
              {currency.format((item.qty || 0) * (item.price || 0))}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
};

const OrderTotalsPreview = () => {
  const record = useRecordContext();
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <MuiTextField
        label="Items subtotal"
        value={currency.format(record?.itemsPrice || 0)}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
      />
      <MuiTextField
        label="Shipping"
        value={currency.format(record?.shippingPrice || 0)}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
      />
      <MuiTextField
        label="Total"
        value={currency.format(record?.totalPrice || 0)}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
      />
    </Stack>
  );
};

const OrderCustomerSnapshot = () => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <Stack spacing={1.25}>
      <Typography variant="body2">
        <strong>Name:</strong> {record.user?.name || record.shippingAddress?.firstName || "—"}
      </Typography>
      <Typography variant="body2">
        <strong>Email:</strong> {record.user?.email || record.shippingAddress?.email || "—"}
      </Typography>
      <Typography variant="body2">
        <strong>Phone:</strong> {record.shippingAddress?.phone || "—"}
      </Typography>
      <Typography variant="body2">
        <strong>Address:</strong> {record.shippingAddress?.address || "—"}
      </Typography>
      <Typography variant="body2">
        <strong>City / Country:</strong> {record.shippingAddress?.city || "—"},{" "}
        {record.shippingAddress?.country || "—"}
      </Typography>
      {record.shippingAddress?.orderNotes ? (
        <Alert severity="info" variant="outlined">
          Customer note: {record.shippingAddress.orderNotes}
        </Alert>
      ) : null}
    </Stack>
  );
};

const OrderHistoryPreview = () => {
  const record = useRecordContext();
  const statusHistory = Array.isArray(record?.statusHistory)
    ? [...record.statusHistory].reverse()
    : [];
  const notes = Array.isArray(record?.adminNotes) ? [...record.adminNotes].reverse() : [];

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Status timeline
        </Typography>
        {statusHistory.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No transitions recorded.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {statusHistory.map((entry, idx) => (
              <Paper
                key={`${entry.changedAt || idx}-${idx}`}
                variant="outlined"
                sx={{ p: 1.25, borderRadius: 1.5 }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {entry.from === entry.to ? entry.to : `${entry.from} -> ${entry.to}`}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : ""}
                  {entry.changedBy?.name ? ` - ${entry.changedBy.name}` : ""}
                </Typography>
                {entry.note ? (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {entry.note}
                  </Typography>
                ) : null}
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Admin notes
        </Typography>
        {notes.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No notes yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {notes.map((note, idx) => (
              <Paper
                key={`${note.createdAt || idx}-${idx}`}
                variant="outlined"
                sx={{ p: 1.25, borderRadius: 1.5 }}
              >
                <Typography variant="body2">{note.body}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
                  {note.createdBy?.name ? ` - ${note.createdBy.name}` : ""}
                  {note.isPrivate ? " - Private" : " - Customer-visible"}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
};

const CancelledOrderFormAside = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);

  const runAction = async (action) => {
    if (!record?.id) return;
    setBusy(true);
    try {
      await action();
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Could not complete action", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (!record) return null;

  const isRefunded = record?.paymentStatus === "refunded";

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Save updates
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Save applies status/payment/tracking edits and appends note/refund updates from the form.
        </Typography>
        <SaveButton label="Save order" variant="contained" fullWidth disabled={busy} />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Refund
        </Typography>
        {isRefunded ? (
          <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>
            Refunded {currency.format(record.refund?.amount || 0)}
            {record.refund?.refundedAt
              ? ` on ${new Date(record.refund.refundedAt).toLocaleDateString()}`
              : ""}
          </Alert>
        ) : (
          <Stack spacing={1.25}>
            <Typography variant="caption" color="text.secondary">
              Process a refund for this cancelled order.
            </Typography>
            <Button
              variant="contained"
              color="warning"
              fullWidth
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  const amount = window.prompt("Refund amount (BDT):", String(record?.totalPrice || ""));
                  if (!amount || Number(amount) <= 0) return;
                  const reason = window.prompt("Refund reason (optional):", "Order cancelled - customer refund");
                  await api.patch(`admin/orders/${record.id}/refund`, {
                    amount: Number(amount),
                    reason: reason || ""
                  });
                  notify("Refund processed", { type: "success" });
                })
              }
            >
              Process Refund
            </Button>
          </Stack>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Quick actions
        </Typography>
        <Stack spacing={1.25}>
          <Button
            variant="outlined"
            color="info"
            size="small"
            startIcon={<FileDown size={16} />}
            onClick={() => {
              import("../../utils/generateReceipt").then(({ generateReceipt }) =>
                generateReceipt(record)
              );
            }}
          >
            Download Receipt (PDF)
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            disabled={busy}
            onClick={() =>
              runAction(async () => {
                const note = window.prompt("Add internal note:", "");
                if (!note || !note.trim()) return;
                await api.post(`admin/orders/${record.id}/notes`, { note, isPrivate: true });
                notify("Note added", { type: "success" });
              })
            }
          >
            Add Quick Note
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          On this page
        </Typography>
        <MuiList dense disablePadding>
          {[
            ["section-order-overview", "Overview"],
            ["section-order-cancel", "Cancel & refund"],
            ["section-order-items", "Items"],
            ["section-order-customer", "Customer & shipping"],
            ["section-order-history", "Timeline & notes"]
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

const statusChoices = [
  { id: "cancelled", name: "Cancelled" },
  { id: "refunded", name: "Refunded" }
];

const CancelledOrderFormFields = () => {
  const record = useRecordContext();

  return (
    <AdminFormPageLayout
      hint="Manage cancelled orders: process refunds, view order details, and track payment status."
      hintTitle="Cancelled order management"
      aside={<CancelledOrderFormAside />}
    >
      <AdminFormSection
        sectionId="section-order-overview"
        title="Overview"
        description="Order status and financial fields."
      >
        <SelectInput source="status" choices={statusChoices} fullWidth />
        <TextInput source="statusNote" label="Status change note" fullWidth multiline minRows={2} />
        <BooleanInput source="isPaid" label="Paid" />
        <TextInput source="paymentReference" label="Payment reference" fullWidth />
        {record?.paymentMethod === "SSLCommerz" && record?.paymentReference && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            SSL Transaction ID: {record.paymentReference} (used automatically for refunds)
          </Typography>
        )}
        <NumberInput source="newRefundAmount" label="Refund amount (BDT)" min={0} fullWidth />
        <TextInput source="newRefundReason" label="Refund reason" fullWidth />
      </AdminFormSection>

    <AdminFormSection
      sectionId="section-order-cancel"
      title="Cancel & refund"
      description="Cancellation details and refund information."
    >
      <CancelRefundInfo />
    </AdminFormSection>

    <AdminFormSection
      sectionId="section-order-items"
      title="Items"
      description="Read-only line items and order totals."
    >
      <OrderItemsPreview />
      <Divider />
      <OrderTotalsPreview />
    </AdminFormSection>

    <AdminFormSection
      sectionId="section-order-customer"
      title="Customer & shipping"
      description="Customer contact details and delivery destination."
    >
      <OrderCustomerSnapshot />
    </AdminFormSection>

    <AdminFormSection
      sectionId="section-order-history"
      title="Timeline & notes"
      description="Status transition history and admin audit notes."
    >
      <OrderHistoryPreview />
     </AdminFormSection>
   </AdminFormPageLayout>
   );
};

export const CancelledOrderEdit = () => (
  <Edit mutationMode="pessimistic" title={titleFromOrder}>
    <SimpleForm toolbar={false}>
      <CancelledOrderFormFields />
    </SimpleForm>
  </Edit>
);
