import { useMemo, useState } from "react";
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
  useRecordContext,
  useRefresh
} from "react-admin";
import api from "../../api";
import { AdminFormPageLayout, AdminFormSection } from "../components/AdminFormChrome";
import { generateReceipt } from "../../utils/generateReceipt";
import { FileDown } from "lucide-react";

const statusChoices = [
  { id: "pending", name: "Pending" },
  { id: "confirmed", name: "Confirmed" },
  { id: "processing", name: "Processing" },
  { id: "shipped", name: "Shipped" },
  { id: "delivered", name: "Delivered" },
  { id: "cancelled", name: "Cancelled" },
  { id: "returned", name: "Returned" }
];

const paymentChoices = [
  { id: "pending", name: "Pending" },
  { id: "paid", name: "Paid" },
  { id: "refunded", name: "Refunded" }
];

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0
});

const titleFromOrder = (record) => `Order #${record?.orderNumber || String(record?.id || "").slice(-8).toUpperCase()}`;

const statusChip = (status) => {
  const s = String(status || "pending");
  const color =
    s === "delivered"
      ? "success"
      : s === "cancelled" || s === "returned"
        ? "error"
        : s === "shipped" || s === "processing"
          ? "info"
          : s === "confirmed"
            ? "primary"
            : "warning";
  return <Chip size="small" variant="outlined" label={s.charAt(0).toUpperCase() + s.slice(1)} color={color} />;
};

const paymentChip = (paymentStatus) => {
  const p = String(paymentStatus || "pending");
  const color = p === "paid" ? "success" : p === "refunded" ? "warning" : "default";
  return <Chip size="small" variant="outlined" label={p.charAt(0).toUpperCase() + p.slice(1)} color={color} />;
};

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const OrderFormAside = () => {
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
          Quick actions
        </Typography>
        <Stack spacing={1.25}>
          <Button
            variant="outlined"
            size="small"
            disabled={busy}
            onClick={() =>
              runAction(async () => {
                await api.patch(`/admin/orders/${record.id}/status`, {
                  status: "processing",
                  note: "Moved to processing from admin quick action"
                });
                notify("Order moved to processing", { type: "success" });
              })
            }
          >
            Mark Processing
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={busy}
            onClick={() =>
              runAction(async () => {
                await api.patch(`/admin/orders/${record.id}/status`, {
                  status: "shipped",
                  note: "Marked shipped from admin quick action"
                });
                notify("Order marked shipped", { type: "success" });
              })
            }
          >
            Mark Shipped
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={busy}
            onClick={() =>
              runAction(async () => {
                await api.patch(`/admin/orders/${record.id}/status`, {
                  status: "delivered",
                  note: "Marked delivered from admin quick action"
                });
                notify("Order marked delivered", { type: "success" });
              })
            }
          >
            Mark Delivered
          </Button>
          <Button
            variant="outlined"
            color="warning"
            size="small"
            disabled={busy}
            onClick={() =>
              runAction(async () => {
                const reason = window.prompt("Cancellation reason (optional):", "");
                await api.patch(`/admin/orders/${record.id}/cancel`, { reason: reason || "" });
                notify("Order cancelled", { type: "success" });
              })
            }
          >
            Cancel Order
          </Button>
          <Button
            variant="outlined"
            color="info"
            size="small"
            startIcon={<FileDown size={16} />}
            onClick={() => generateReceipt(record)}
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
                await api.post(`/admin/orders/${record.id}/notes`, { note, isPrivate: true });
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
            ["section-order-fulfillment", "Fulfillment & payment"],
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

const OrderItemsPreview = () => {
  const record = useRecordContext();
  const items = useMemo(() => (Array.isArray(record?.orderItems) ? record.orderItems : []), [record]);

  if (!items.length) {
    return <Typography color="text.secondary">No line items on this order.</Typography>;
  }

  return (
    <Stack spacing={1.25}>
      {items.map((item, idx) => (
        <Paper key={`${item.product?._id || item.product || idx}-${idx}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography fontWeight={600}>{item.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Qty {item.qty} x {currency.format(item.price || 0)}
              </Typography>
            </Box>
            <Typography fontWeight={700}>{currency.format((item.qty || 0) * (item.price || 0))}</Typography>
          </Stack>
        </Paper>
      ))}
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
        <strong>City / Country:</strong> {record.shippingAddress?.city || "—"}, {record.shippingAddress?.country || "—"}
      </Typography>
      {record.shippingAddress?.orderNotes ? (
        <Alert severity="info" variant="outlined">
          Customer note: {record.shippingAddress.orderNotes}
        </Alert>
      ) : null}
    </Stack>
  );
};

const OrderTotalsPreview = () => {
  const record = useRecordContext();
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <MuiTextField label="Items subtotal" value={currency.format(record?.itemsPrice || 0)} fullWidth />
      <MuiTextField label="Shipping" value={currency.format(record?.shippingPrice || 0)} fullWidth />
      <MuiTextField label="Total" value={currency.format(record?.totalPrice || 0)} fullWidth />
    </Stack>
  );
};

const OrderHistoryPreview = () => {
  const record = useRecordContext();
  const statusHistory = Array.isArray(record?.statusHistory) ? [...record.statusHistory].reverse() : [];
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
              <Paper key={`${entry.changedAt || idx}-${idx}`} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
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
              <Paper key={`${note.createdAt || idx}-${idx}`} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
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

const orderFormHint =
  "This works like WooCommerce order admin: adjust status/payment/tracking, keep internal notes, and use quick actions for the common flow from processing to delivery.";

const OrderFormFields = () => (
  <AdminFormPageLayout hint={orderFormHint} hintTitle="Order operations" aside={<OrderFormAside />}>
    <AdminFormSection
      sectionId="section-order-overview"
      title="Overview"
      description="Core order lifecycle controls and accounting fields."
    >
      <SelectInput source="status" choices={statusChoices} fullWidth />
      <TextInput source="statusNote" label="Status change note" fullWidth multiline minRows={2} />
      <BooleanInput source="isPaid" label="Paid" />
      <TextInput source="paymentReference" label="Payment reference" fullWidth />
      <TextInput source="cancelReason" label="Cancel reason" fullWidth />
      <NumberInput source="newRefundAmount" label="Refund amount (BDT)" min={0} fullWidth />
      <TextInput source="newRefundReason" label="Refund reason" fullWidth />
    </AdminFormSection>

    <AdminFormSection
      sectionId="section-order-fulfillment"
      title="Fulfillment & payment"
      description="Carrier and tracking fields used by the operations team."
    >
      <TextInput source="fulfillment.carrier" label="Carrier" fullWidth />
      <TextInput source="fulfillment.trackingNumber" label="Tracking number" fullWidth />
      <TextInput source="fulfillment.shippedAt" label="Shipped at (ISO date)" fullWidth />
      <TextInput source="internalMemo" label="Internal memo" fullWidth multiline minRows={3} />
      <TextInput source="adminNote" label="Add internal note" fullWidth multiline minRows={3} />
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

export const OrderList = () => (
  <List
    actions={<ListActions />}
    perPage={25}
    sort={{ field: "createdAt", order: "DESC" }}
    filters={[
      <TextInput key="q" source="q" label="Search" alwaysOn resettable />,
      <SelectInput key="status" source="status" choices={statusChoices} alwaysOn />,
      <SelectInput key="paymentStatus" source="paymentStatus" choices={paymentChoices} alwaysOn />
    ]}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <FunctionField label="Order" render={(record) => `#${record.orderNumber || String(record.id || "").slice(-8).toUpperCase()}`} />
      <FunctionField label="Customer" render={(record) => record.customerName || record.user?.name || "Customer"} />
      <FunctionField label="Status" render={(record) => statusChip(record.status)} />
      <FunctionField label="Payment" render={(record) => paymentChip(record.paymentStatus)} />
      <FunctionField label="Items" render={(record) => record.itemCount ?? record.orderItems?.length ?? 0} />
      <NumberField source="totalPrice" label="Total" options={{ style: "currency", currency: "BDT", maximumFractionDigits: 0 }} />
      <DateField source="createdAt" label="Placed" showTime />
      <EditButton />
    </Datagrid>
  </List>
);

export const OrderEdit = () => (
  <Edit mutationMode="pessimistic" title={titleFromOrder}>
    <SimpleForm toolbar={false}>
      <OrderFormFields />
    </SimpleForm>
  </Edit>
);
