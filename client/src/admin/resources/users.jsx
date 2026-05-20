import { Chip, Stack, Typography } from "@mui/material";
import {
  Datagrid,
  DateField,
  DeleteButton,
  EmailField,
  FunctionField,
  List,
  SearchInput,
  Show,
  SimpleShowLayout,
  TextField,
  ShowButton,
  NumberField
} from "react-admin";

const userFilters = [<SearchInput key="q" source="q" placeholder="Search by name/email/phone" alwaysOn />];

const roleChip = (isAdmin) => {
  const color = isAdmin ? "warning" : "default";
  const label = isAdmin ? "Admin" : "Customer";
  return <Chip size="small" variant="outlined" color={color} label={label} />;
};

export const UserList = () => (
  <List filters={userFilters} sort={{ field: "createdAt", order: "DESC" }} perPage={25}>
    <Datagrid rowClick="show">
      <TextField source="name" label="Full Name" />
      <EmailField source="email" />
      <TextField source="phone" />
      <FunctionField label="Role" render={(record) => roleChip(record?.isAdmin)} />
      <DateField source="createdAt" label="Registered" showTime />
      <ShowButton />
      <DeleteButton
        mutationMode="pessimistic"
        confirmTitle="Delete account?"
        confirmContent="This will permanently remove this user account."
      />
    </Datagrid>
  </List>
);

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="name" label="Full Name" />
      <EmailField source="email" />
      <TextField source="phone" />
      <FunctionField label="Role" render={(record) => roleChip(record?.isAdmin)} />
      <DateField source="createdAt" label="Registered At" showTime />
      <DateField source="updatedAt" label="Last Updated" showTime />

      <FunctionField
        label="Latest Order ID"
        render={(record) => (record?.latestOrder?._id ? String(record.latestOrder._id) : "No orders yet")}
      />
      <NumberField source="orderCount" label="Total Orders" />
      <FunctionField
        label="Latest Order Status"
        render={(record) => {
          const status = record?.latestOrder?.status;
          if (!status) return "No orders yet";
          return status.charAt(0).toUpperCase() + status.slice(1);
        }}
      />
      <FunctionField
        label="Latest Order Total"
        render={(record) => {
          if (!record?.latestOrder) return "No orders yet";
          return `BDT ${Number(record.latestOrder.totalPrice || 0).toFixed(0)}`;
        }}
      />
      <FunctionField
        label="Latest Order Date"
        render={(record) => {
          const createdAt = record?.latestOrder?.createdAt;
          if (!createdAt) return "No orders yet";
          const dt = new Date(createdAt);
          return Number.isNaN(dt.getTime()) ? "No orders yet" : dt.toLocaleString();
        }}
      />

      <Stack spacing={1} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          This view is read-only. To grant admin access, use the promote-admin script from server.
        </Typography>
      </Stack>
    </SimpleShowLayout>
  </Show>
);
