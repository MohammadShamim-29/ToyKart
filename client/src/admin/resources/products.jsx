import {
  Box,
  Chip,
  LinearProgress,
  List as MuiList,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Button,
  IconButton,
  TextField as MuiTextField,
  Typography
} from "@mui/material";
import { Trash2 } from "lucide-react";
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  FunctionField,
  EditButton,
  DeleteButton,
  Edit,
  Create,
  SimpleForm,
  SaveButton,
  TextInput,
  NumberInput,
  BooleanInput,
  SelectInput,
  ReferenceInput,
  AutocompleteInput,
  required,
  minLength,
  ListActions,
  useGetList,
  useInput,
  useNotify
} from "react-admin";
import api from "../../api";
import { AdminFormPageLayout, AdminFormSection } from "../components/AdminFormChrome";

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const ProductFormAside = ({ mode }) => (
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
        {mode === "create" ? "Publish" : "Update"}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, lineHeight: 1.5 }}>
        {mode === "create"
          ? "When you are ready, save the product to add it to the catalog."
          : "Save your changes or remove the product from the storefront below."}
      </Typography>
      <Stack spacing={1.25} alignItems="stretch">
        <SaveButton
          label={mode === "create" ? "Create product" : "Save changes"}
          variant="contained"
          fullWidth
          size="medium"
        />
        {mode === "edit" ? (
          <DeleteButton
            mutationMode="pessimistic"
            confirmTitle="Discontinue product?"
            confirmContent="This removes the product from the storefront (status: discontinued)."
            variant="outlined"
            color="inherit"
            fullWidth
          />
        ) : null}
      </Stack>
    </Paper>
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        On this page
      </Typography>
      <MuiList dense disablePadding>
        {[
          ["section-product-overview", "Overview"],
          ["section-product-pricing", "Pricing and inventory"],
          ["section-product-merch", "Merchandising"],
          ["section-product-shipping", "Shipping"]
        ].map(([id, label]) => (
          <ListItemButton key={id} onClick={() => scrollToSection(id)} sx={{ borderRadius: 1, py: 0.75 }}>
            <ListItemText primary={label} primaryTypographyProps={{ variant: "body2" }} />
          </ListItemButton>
        ))}
      </MuiList>
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
        Quick tips
      </Typography>
      <Typography component="ul" variant="body2" color="text.secondary" sx={{ m: 0, pl: 2.25, lineHeight: 1.6 }}>
        <li>SKU and slug must stay unique in the catalog.</li>
        <li>Descriptions need at least 20 characters.</li>
        <li>Add a primary image and optional gallery shots under Merchandising (5 MB each).</li>
        <li>Save lives in the sidebar so it is always one glance away.</li>
      </Typography>
    </Paper>
  </Stack>
);

const ProductImageInput = (props) => {
  const { field, fieldState, isRequired } = useInput(props);
  const notify = useNotify();
  const { invalid, error } = fieldState;

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/upload", fd);
      field.onChange(data.url);
      notify("Image uploaded", { type: "success" });
    } catch (err) {
      const msg = err.response?.data?.message || "Image upload failed";
      notify(msg, { type: "error" });
    }
  };

  return (
    <Box width="100%">
      <Stack spacing={1.5}>
        <MuiTextField
          label={props.label || "Product image"}
          value={field.value ?? ""}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
          error={invalid}
          helperText={error?.message || props.helperText}
          required={isRequired}
          fullWidth
          InputLabelProps={{ shrink: Boolean(field.value) }}
        />
        <Box>
          <Button variant="outlined" component="label" size="small">
            Upload image
            <input type="file" accept="image/*" hidden onChange={onPick} />
          </Button>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            JPEG, PNG, or WebP up to 5 MB. The field updates with a public URL after upload.
          </Typography>
        </Box>
        {field.value ? (
          <Box
            component="img"
            src={field.value}
            alt=""
            sx={{
              maxWidth: 320,
              maxHeight: 220,
              objectFit: "contain",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              alignSelf: "flex-start"
            }}
          />
        ) : null}
      </Stack>
    </Box>
  );
};

const ProductGalleryInput = (props) => {
  const { field, fieldState } = useInput({ ...props, defaultValue: [] });
  const notify = useNotify();
  const { invalid, error } = fieldState;
  const list = Array.isArray(field.value) ? field.value : [];

  const uploadFiles = async (files) => {
    const urls = await Promise.all(
      files.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/admin/upload", fd);
        return data.url;
      })
    );
    return urls;
  };

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    try {
      const urls = await uploadFiles(files);
      field.onChange([...list, ...urls]);
      notify(urls.length === 1 ? "Gallery image uploaded" : `${urls.length} gallery images uploaded`, {
        type: "success"
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed";
      notify(msg, { type: "error" });
    }
  };

  const removeAt = (index) => {
    field.onChange(list.filter((_, i) => i !== index));
  };

  return (
    <Box width="100%">
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
        {props.label || "Gallery images"}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        Extra photos shown as thumbnails on the product page. Upload one or many at a time (same limits as
        the primary image).
      </Typography>
      <Button variant="outlined" component="label" size="small" sx={{ mb: 1.5 }}>
        Add gallery images
        <input type="file" accept="image/*" hidden multiple onChange={onPick} />
      </Button>
      {invalid && error?.message ? (
        <Typography variant="caption" color="error" display="block">
          {error.message}
        </Typography>
      ) : null}
      {list.length > 0 ? (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {list.map((url, index) => (
            <Paper
              key={`${url}-${index}`}
              variant="outlined"
              sx={{
                p: 1,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                borderRadius: 1.5
              }}
            >
              <Box
                component="img"
                src={url}
                alt=""
                sx={{
                  width: 72,
                  height: 72,
                  objectFit: "cover",
                  borderRadius: 1,
                  flexShrink: 0
                }}
              />
              <MuiTextField
                size="small"
                fullWidth
                label="URL"
                value={url}
                onChange={(e) => {
                  const next = [...list];
                  next[index] = e.target.value;
                  field.onChange(next);
                }}
                onBlur={field.onBlur}
              />
              <IconButton aria-label="Remove gallery image" onClick={() => removeAt(index)} edge="end" size="small">
                <Trash2 size={20} strokeWidth={2} />
              </IconButton>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No gallery images yet.
        </Typography>
      )}
    </Box>
  );
};

const statusChoices = [
  { id: "active", name: "Active" },
  { id: "inactive", name: "Inactive" },
  { id: "discontinued", name: "Discontinued" }
];

const ageChoices = [
  { id: "0-2", name: "0-2" },
  { id: "3-5", name: "3-5" },
  { id: "6-8", name: "6-8" },
  { id: "9-12", name: "9-12" },
  { id: "13+", name: "13+" }
];

const tagsFormat = (v) => (Array.isArray(v) ? v.join(", ") : v || "");
const tagsParse = (v) => v;

const statusChip = (status) => {
  const s = status ?? "";
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
  const color =
    s === "active" ? "success" : s === "inactive" ? "warning" : s === "discontinued" ? "default" : "default";
  return <Chip size="small" label={label} color={color} variant="outlined" />;
};

const productFormHint =
  "Sections group related fields. The companion column holds Publish (save), shortcuts, and tips—on phones it appears above the fields so Save stays easy to find. Add photos under Merchandising.";

const ProductFormFields = ({ mode }) => (
  <AdminFormPageLayout
    hint={productFormHint}
    hintTitle="How this form works"
    aside={<ProductFormAside mode={mode} />}
  >
    <AdminFormSection
      sectionId="section-product-overview"
      title="Overview"
      description="Name, identifiers, category, and how the product appears to customers."
    >
      <TextInput source="name" validate={required()} fullWidth />
      <TextInput source="sku" validate={required()} fullWidth />
      <TextInput source="slug" validate={required()} fullWidth />
      <ReferenceInput
        source="category"
        reference="categories"
        filter={{ isActive: true }}
        perPage={200}
        sort={{ field: "sortOrder", order: "ASC" }}
      >
        <AutocompleteInput optionText="name" validate={required()} label="Category" fullWidth />
      </ReferenceInput>
      <TextInput
        source="description"
        validate={[required(), minLength(20, "Use at least 20 characters")]}
        fullWidth
        multiline
        minRows={4}
      />
      <SelectInput source="status" choices={statusChoices} fullWidth />
      <BooleanInput source="isFeatured" label="Featured on homepage highlights" />
      <BooleanInput source="newArrival" label="Show in New Arrivals page" />
    </AdminFormSection>

    <AdminFormSection
      sectionId="section-product-pricing"
      title="Pricing and inventory"
      description="Price in BDT and how many units you can sell."
    >
      <NumberInput source="price" validate={required()} min={0} step={1} helperText="Sale price (BDT)" fullWidth />
      <NumberInput
        source="compareAtPrice"
        min={0}
        step={1}
        helperText="Optional higher list price to show a strikethrough discount (leave empty if none)"
        fullWidth
      />
      <NumberInput source="countInStock" validate={required()} min={0} step={1} fullWidth />
    </AdminFormSection>

    <AdminFormSection
      sectionId="section-product-merch"
      title="Merchandising"
      description="Brand, imagery, tags, and attributes shoppers filter by."
    >
      <TextInput source="brand" fullWidth />
      <TextInput source="subcategory" fullWidth />
      <ProductImageInput source="image" label="Product image" />
      <ProductGalleryInput source="gallery" label="Gallery images" />
      <SelectInput source="ageGroup" choices={ageChoices} fullWidth />
      <TextInput source="material" fullWidth />
      <TextInput
        source="tags"
        fullWidth
        helperText="Comma-separated keywords"
        format={tagsFormat}
        parse={tagsParse}
      />
    </AdminFormSection>

    <AdminFormSection
      sectionId="section-product-shipping"
      title="Shipping"
      description="Size and weight for fulfillment (optional but helpful)."
    >
      <NumberInput source="weightGrams" min={0} label="Weight (grams)" fullWidth />
      <NumberInput source="dimensionsCm.length" min={0} label="Length (cm)" fullWidth />
      <NumberInput source="dimensionsCm.width" min={0} label="Width (cm)" fullWidth />
      <NumberInput source="dimensionsCm.height" min={0} label="Height (cm)" fullWidth />
    </AdminFormSection>
  </AdminFormPageLayout>
);

export const ProductList = () => (
  <List actions={<ListActions />} perPage={25} sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="name" />
      <FunctionField
        label="SKU"
        render={(record) => (
          <Box component="span" sx={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8125rem" }}>
            {record.sku}
          </Box>
        )}
      />
      <FunctionField label="Category" render={(record) => record.category?.name ?? "—"} />
      <NumberField
        source="price"
        options={{ style: "currency", currency: "BDT", maximumFractionDigits: 0 }}
      />
      <NumberField source="countInStock" label="Stock" />
      <FunctionField label="Status" render={(record) => statusChip(record.status)} />
      <EditButton />
      <DeleteButton
        mutationMode="pessimistic"
        confirmTitle="Discontinue product?"
        confirmContent="This removes the product from the storefront (status: discontinued)."
      />
    </Datagrid>
  </List>
);

export const ProductEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={false}>
      <ProductFormFields mode="edit" />
    </SimpleForm>
  </Edit>
);

const defaultProductValues = (categoryId) => ({
  category: categoryId != null ? String(categoryId) : "",
  subcategory: "General",
  brand: "ToyKart",
  image: "https://placehold.co/640x480",
  description:
    "Write a short, shopper-friendly description of this toy. You can edit this text before publishing.",
  status: "active",
  isFeatured: false,
  newArrival: false,
  ageGroup: "3-5",
  material: "Mixed",
  price: 0,
  weightGrams: 0,
  dimensionsCm: { length: 0, width: 0, height: 0 },
  gallery: [],
  tags: "",
  countInStock: 0
});

export const ProductCreate = () => {
  const { data, isLoading, isPending } = useGetList("categories", {
    filter: { isActive: true },
    pagination: { page: 1, perPage: 200 },
    sort: { field: "sortOrder", order: "ASC" }
  });

  if (isPending || isLoading) {
    return <LinearProgress />;
  }

  if (!data?.length) {
    return (
      <Create>
        <Typography variant="body1" sx={{ p: 2 }}>
          Create at least one active category before adding products.
        </Typography>
      </Create>
    );
  }

  const firstId = data[0].id ?? "";
  return (
    <Create>
      <SimpleForm toolbar={false} defaultValues={defaultProductValues(firstId)}>
        <ProductFormFields mode="create" />
      </SimpleForm>
    </Create>
  );
};
