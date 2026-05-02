import { Paper, Stack, Typography } from "@mui/material";
import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  NumberField,
  FunctionField,
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
  ListActions,
  ReferenceInput,
  SelectInput
} from "react-admin";
import { AdminFormPageLayout, AdminFormSection } from "../components/AdminFormChrome";

const hint =
  "Checkout district/city options are controlled here. Disabled districts are hidden immediately, even if country is enabled.";

const DistrictFormAside = ({ isCreate }) => (
  <Stack spacing={2}>
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        {isCreate ? "Create district/city" : "Save district/city"}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Set sort order to control district dropdown order per country.
      </Typography>
      <Stack spacing={1.25}>
        <SaveButton label={isCreate ? "Add district/city" : "Save changes"} variant="contained" fullWidth />
        {!isCreate ? (
          <DeleteButton mutationMode="pessimistic" variant="outlined" color="inherit" fullWidth label="Delete" />
        ) : null}
      </Stack>
    </Paper>
  </Stack>
);

const DistrictFormFields = ({ isCreate = false }) => (
  <AdminFormPageLayout hint={hint} hintTitle="District availability" aside={<DistrictFormAside isCreate={isCreate} />}>
    <AdminFormSection title="District/city details" description="Each district belongs to one country.">
      <TextInput source="name" label="District / City" validate={required()} fullWidth />
      <ReferenceInput source="country" reference="shipping-countries">
        <SelectInput optionText="name" optionValue="id" validate={required()} fullWidth />
      </ReferenceInput>
      <NumberInput source="sortOrder" fullWidth {...(isCreate ? { defaultValue: 0 } : {})} />
      <BooleanInput source="isEnabled" label="Enabled for checkout" {...(isCreate ? { defaultValue: true } : {})} />
    </AdminFormSection>
  </AdminFormPageLayout>
);

export const ShippingDistrictList = () => (
  <List actions={<ListActions />} sort={{ field: "sortOrder", order: "ASC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="name" label="District / City" />
      <FunctionField label="Country" render={(record) => record?.country?.name || "—"} />
      <NumberField source="sortOrder" />
      <BooleanField source="isEnabled" label="Enabled" />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

export const ShippingDistrictEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={false}>
      <DistrictFormFields />
    </SimpleForm>
  </Edit>
);

export const ShippingDistrictCreate = () => (
  <Create>
    <SimpleForm toolbar={false}>
      <DistrictFormFields isCreate />
    </SimpleForm>
  </Create>
);
