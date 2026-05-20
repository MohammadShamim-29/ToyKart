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

const categoryHint =
  "Lower sort numbers list earlier in the storefront. Leave slug empty to generate a URL-safe value from the name. Deactivating hides the category without deleting products.";

const CategoryFormAside = ({ isCreate }) => (
  <Stack spacing={2}>
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 2,
        borderRadius: 2,
        borderColor: theme.palette.mode === "light" ? "rgba(37, 99, 235, 0.35)" : undefined,
        bgcolor: theme.palette.mode === "light" ? "rgba(255, 255, 255, 0.98)" : undefined
      })}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        {isCreate ? "Publish" : "Update"}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, lineHeight: 1.5 }}>
        {isCreate
          ? "Save the category so you can assign products to it."
          : "Save changes or deactivate if customers should no longer see it."}
      </Typography>
      <Stack spacing={1.25} alignItems="stretch">
        <SaveButton
          label={isCreate ? "Create category" : "Save category"}
          variant="contained"
          fullWidth
          size="medium"
        />
        {!isCreate ? (
          <DeleteButton
            mutationMode="pessimistic"
            confirmTitle="Deactivate category?"
            confirmContent="Customers will no longer see products in this category until you reactivate it."
            variant="outlined"
            color="inherit"
            fullWidth
            label="Deactivate category"
          />
        ) : null}
      </Stack>
    </Paper>
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        Checklist
      </Typography>
      <Typography component="ul" variant="body2" color="text.secondary" sx={{ m: 0, pl: 2.25, lineHeight: 1.65 }}>
        <li>
          <strong>Name</strong> is what shoppers see; keep it short and clear.
        </li>
        <li>
          <strong>Slug</strong> becomes the URL segment—lowercase, no spaces. Optional if you want it
          auto-generated.
        </li>
        <li>
          <strong>Sort</strong> controls menu order (0 = first).
        </li>
        <li>
          Turn off <strong>Visible</strong> to hide the category until you are ready.
        </li>
      </Typography>
    </Paper>
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 2,
        borderRadius: 2,
        bgcolor: theme.palette.mode === "light" ? "rgba(248, 250, 252, 0.95)" : undefined
      })}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        After saving
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
        Assign products to this category from the Products screen. Changes apply to the storefront on the next
        refresh.
      </Typography>
    </Paper>
  </Stack>
);

const CategoryFormFields = ({ isCreate = false }) => (
  <AdminFormPageLayout
    hint={categoryHint}
    hintTitle="Categories in ToyKart"
    aside={<CategoryFormAside isCreate={isCreate} />}
  >
    <AdminFormSection title="Category details" description="Name and presentation in the catalog.">
      <TextInput source="name" validate={required()} fullWidth />
      <TextInput source="slug" fullWidth helperText="Leave blank to auto-generate from the name" />
      <TextInput source="description" fullWidth multiline minRows={3} />
      <NumberInput
        source="sortOrder"
        fullWidth
        helperText="0 = first in navigation lists"
        {...(isCreate ? { defaultValue: 0 } : {})}
      />
      <BooleanInput source="isActive" label="Visible to customers" {...(isCreate ? { defaultValue: true } : {})} />
    </AdminFormSection>
  </AdminFormPageLayout>
);

export const CategoryList = () => (
  <List
    actions={<ListActions />}
    sort={{ field: "sortOrder", order: "ASC" }}
    filters={[<TextInput key="q" source="q" label="Search" alwaysOn resettable />]}
  >
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <TextField source="slug" />
      <NumberField source="sortOrder" label="Sort" />
      <BooleanField source="isActive" label="Active" />
      <EditButton />
      <DeleteButton
        mutationMode="pessimistic"
        confirmTitle="Deactivate category?"
        confirmContent="Customers will no longer see products in this category until it is reactivated."
      />
    </Datagrid>
  </List>
);

export const CategoryEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={false}>
      <CategoryFormFields />
    </SimpleForm>
  </Edit>
);

export const CategoryCreate = () => (
  <Create>
    <SimpleForm toolbar={false}>
      <CategoryFormFields isCreate />
    </SimpleForm>
  </Create>
);
