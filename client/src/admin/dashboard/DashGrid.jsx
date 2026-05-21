import Grid from "@mui/material/Grid";

/** MUI Grid v2 wrapper — avoids legacy `item` / `xs` deprecation warnings. */
export const DashGrid = ({ children, spacing = 2, sx, ...rest }) => (
  <Grid container spacing={spacing} sx={sx} {...rest}>
    {children}
  </Grid>
);

export const DashGridItem = ({ children, size = { xs: 12 }, sx, ...rest }) => (
  <Grid size={size} sx={sx} {...rest}>
    {children}
  </Grid>
);
