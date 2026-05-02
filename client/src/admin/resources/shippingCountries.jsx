import { Paper, Stack, Typography } from "@mui/material";
import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  NumberField,
  EditButton,
  DeleteButton,
  Edit,
  Create,
  SimpleForm,
  SaveButton,
  TextInput,
  BooleanInput,
  NumberInput,
  required,
  ListActions
} from "react-admin";
import { AdminFormPageLayout, AdminFormSection } from "../components/AdminFormChrome";

const hint =
  "Only enabled countries with at least one enabled district appear at checkout. Sort order controls dropdown order.";

const CountryFormAside = ({ isCreate }) => (
  <Stack spacing={2}>
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        {isCreate ? "Create country" : "Save country"}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Disable a country to hide it from checkout instantly.
      </Typography>
      <Stack spacing={1.25}>
        <SaveButton label={isCreate ? "Add country" : "Save changes"} variant="contained" fullWidth />
        {!isCreate ? (
          <DeleteButton
            mutationMode="pessimistic"
            confirmTitle="Delete country?"
            confirmContent="All districts under this country will also be removed."
            variant="outlined"
            color="inherit"
            fullWidth
            label="Delete country"
          />
        ) : null}
      </Stack>
    </Paper>
  </Stack>
);

const CountryFormFields = ({ isCreate = false }) => (
  <AdminFormPageLayout hint={hint} hintTitle="Checkout location visibility" aside={<CountryFormAside isCreate={isCreate} />}>
    <AdminFormSection title="Country details" description="Manage available shipping countries.">
      <TextInput source="name" validate={required()} fullWidth />
      <TextInput source="isoCode" fullWidth helperText="Optional 2-3 letter country code (e.g. BD)." />
      <NumberInput source="sortOrder" fullWidth {...(isCreate ? { defaultValue: 0 } : {})} />
      <BooleanInput source="isEnabled" label="Enabled for checkout" {...(isCreate ? { defaultValue: true } : {})} />
    </AdminFormSection>
  </AdminFormPageLayout>
);

export const ShippingCountryList = () => (
  <List actions={<ListActions />} sort={{ field: "sortOrder", order: "ASC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="name" />
      <TextField source="isoCode" />
      <NumberField source="sortOrder" />
      <BooleanField source="isEnabled" label="Enabled" />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

export const ShippingCountryEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={false}>
      <CountryFormFields />
    </SimpleForm>
  </Edit>
);

export const ShippingCountryCreate = () => (
  <Create>
    <SimpleForm toolbar={false}>
      <CountryFormFields isCreate />
    </SimpleForm>
  </Create>
);
