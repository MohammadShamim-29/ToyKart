import { useNotify } from "react-admin";
import { useInput } from "react-admin";
import { Box, Button, IconButton, Paper, Stack, TextField as MuiTextField, Typography } from "@mui/material";
import { Trash2 } from "lucide-react";
import api from "../../api";

export const ProductImageInput = (props) => {
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
      notify(err.response?.data?.message || "Image upload failed", { type: "error" });
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
        <Button variant="outlined" component="label" size="small" sx={{ alignSelf: "flex-start" }}>
          Upload image
          <input type="file" accept="image/*" hidden onChange={onPick} />
        </Button>
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
              borderColor: "divider"
            }}
          />
        ) : null}
      </Stack>
    </Box>
  );
};

export const ProductGalleryInput = (props) => {
  const { field, fieldState } = useInput({ ...props, defaultValue: [] });
  const notify = useNotify();
  const list = Array.isArray(field.value) ? field.value : [];

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          const { data } = await api.post("/admin/upload", fd);
          return data.url;
        })
      );
      field.onChange([...list, ...urls]);
      notify(urls.length === 1 ? "Gallery image uploaded" : `${urls.length} gallery images uploaded`, {
        type: "success"
      });
    } catch (err) {
      notify(err.response?.data?.message || "Upload failed", { type: "error" });
    }
  };

  return (
    <Box width="100%">
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
        Gallery images
      </Typography>
      <Button variant="outlined" component="label" size="small" sx={{ mb: 1.5 }}>
        Add gallery images
        <input type="file" accept="image/*" hidden multiple onChange={onPick} />
      </Button>
      {list.length > 0 ? (
        <Stack spacing={1}>
          {list.map((url, index) => (
            <Paper key={`${url}-${index}`} variant="outlined" sx={{ p: 1, display: "flex", gap: 1, alignItems: "center" }}>
              <Box component="img" src={url} alt="" sx={{ width: 48, height: 48, objectFit: "cover", borderRadius: 1 }} />
              <MuiTextField
                size="small"
                fullWidth
                value={url}
                onChange={(e) => {
                  const next = [...list];
                  next[index] = e.target.value;
                  field.onChange(next);
                }}
              />
              <IconButton size="small" onClick={() => field.onChange(list.filter((_, i) => i !== index))}>
                <Trash2 size={18} />
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
