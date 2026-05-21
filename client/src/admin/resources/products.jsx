import { useState, useEffect } from "react";
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
  TextField as MuiTextField,
  Typography
} from "@mui/material";
import ProductCountInStockInput from "../components/ProductCountInStockInput";
import ProductInventorySection from "../components/ProductInventorySection";
import { transformProductForSave } from "../utils/productFormTransform";
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
import { useFormContext, useWatch } from "react-hook-form";
import { AdminFormPageLayout, AdminFormSection } from "../components/AdminFormChrome";

const AutoGenerateFields = () => {
  const { setValue, getValues } = useFormContext();
  const name = useWatch({ name: "name" });
  const [lastProcessedName, setLastProcessedName] = useState("");

  useEffect(() => {
    if (!name || name === lastProcessedName) return;
    
    setLastProcessedName(name);
    const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
    
    // Auto populate slug if empty or if it was previously auto-filled
    const currentSlug = getValues("slug");
    if (!currentSlug || currentSlug.includes("-auto-")) {
       setValue("slug", slug);
    }

    // Auto populate SKU if empty
    const currentSku = getValues("sku");
    if (!currentSku) {
      const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
      const random = Math.floor(1000 + Math.random() * 9000);
      setValue("sku", `${prefix}-${random}`);
    }
  }, [name, setValue, getValues, lastProcessedName]);

  return null;
};

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
        <li>Under Images & stock, pick no color variants or multiple colors, then upload photos (5 MB each).</li>
        <li>Save lives in the sidebar so it is always one glance away.</li>
      </Typography>
    </Paper>
  </Stack>
);

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

const validateProductForm = (values) => {
  const errors = {};
  const hasColorVariants = Boolean(values?.hasColorVariants);
  const variants = values?.colorVariants;

  if (hasColorVariants && Array.isArray(variants) && variants.length > 0) {
    const featured = variants.find((v) => v.isFeatured) ?? variants[0];
    if (!String(featured?.colorName ?? "").trim()) {
      errors.colorVariants = "Storefront color needs a color name.";
    } else if (!String(featured?.image ?? "").trim()) {
      errors.colorVariants = "Storefront color needs a main image upload.";
    }
  } else if (!hasColorVariants) {
    if (!String(values?.image ?? "").trim()) {
      errors.image = "Product image is required when not using color variants.";
    }
  }
  return errors;
};

const productFormHint =
  "Choose no color variants for a single image and stock, or multiple colors for per-color images and stock.";

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
      <ProductCountInStockInput />
    </AdminFormSection>

    <AdminFormSection
      sectionId="section-product-inventory"
      title="Images & stock"
      description="Choose whether this product has color variants, then add images and inventory."
    >
      <ProductInventorySection />
    </AdminFormSection>

    <AdminFormSection
      sectionId="section-product-merch"
      title="Merchandising"
      description="Brand, tags, and attributes shoppers filter by."
    >
      <TextInput source="brand" fullWidth />
      <TextInput source="subcategory" fullWidth />
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
  <List
    actions={<ListActions />}
    perPage={25}
    sort={{ field: "createdAt", order: "DESC" }}
    filters={[<TextInput key="q" source="q" label="Search" alwaysOn resettable />]}
  >
    <Datagrid rowClick="edit">
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
    <SimpleForm toolbar={false} transform={transformProductForSave} validate={validateProductForm}>
      <ProductFormFields mode="edit" />
    </SimpleForm>
  </Edit>
);

const defaultProductValues = (categoryId) => ({
  category: categoryId != null ? String(categoryId) : "",
  subcategory: "General",
  brand: "ToyKart",
  image: "",
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
  countInStock: 0,
  hasColorVariants: false,
  colorVariants: []
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
      <SimpleForm
        toolbar={false}
        defaultValues={defaultProductValues(firstId)}
        transform={transformProductForSave}
        validate={validateProductForm}
      >
        <AutoGenerateFields />
        <ProductFormFields mode="create" />
      </SimpleForm>
    </Create>
  );
};
