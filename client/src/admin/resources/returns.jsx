import {
  Datagrid,
  DateField,
  Edit,
  EditButton,
  FunctionField,
  List,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput
} from "react-admin";

const statusChoices = [
  { id: "requested", name: "Requested" },
  { id: "under_review", name: "Under Review" },
  { id: "more_info_required", name: "More Info Required" },
  { id: "approved", name: "Approved" },
  { id: "rejected", name: "Rejected" }
];

export const ReturnRequestList = () => (
  <List sort={{ field: "createdAt", order: "DESC" }} perPage={25}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <FunctionField label="Order" render={(record) => String(record.order?._id || "").slice(-6).toUpperCase()} />
      <FunctionField label="Customer" render={(record) => record.user?.name || record.user?.email || "-"} />
      <FunctionField label="Type" render={(record) => record.requestType || "return_refund"} />
      <TextField source="status" />
      <DateField source="createdAt" showTime />
      <EditButton />
    </Datagrid>
  </List>
);

export const ReturnRequestEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <FunctionField label="Order ID" render={(record) => record.order?._id || "-"} />
      <FunctionField label="Customer" render={(record) => record.user?.name || record.user?.email || "-"} />
      <TextInput source="requestType" fullWidth disabled />
      <SelectInput source="status" choices={statusChoices} fullWidth />
      <TextInput source="customerReason" multiline minRows={3} fullWidth disabled />
      <TextInput source="adminDecisionNote" multiline minRows={3} fullWidth />
      <FunctionField
        label="Latest Timeline"
        render={(record) => {
          const items = Array.isArray(record?.timeline) ? [...record.timeline].reverse().slice(0, 5) : [];
          if (items.length === 0) return "No timeline yet.";
          return items.map((it) => `${it.status} - ${it.note || ""}`).join(" | ");
        }}
      />
    </SimpleForm>
  </Edit>
);
