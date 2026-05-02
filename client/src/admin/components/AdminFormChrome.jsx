import { Alert, Box, Paper, Typography } from "@mui/material";

/**
 * Two-column layout on md+: primary form + optional aside (tips, nav).
 * Clusters content up to maxWidth so wide screens get balanced margins instead of one empty edge.
 */
export const AdminFormPageLayout = ({ hint, hintTitle = "Before you start", aside, children }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      width: "100%"
    }}
  >
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: aside ? "column-reverse" : "column", md: "row" },
        alignItems: "flex-start",
        gap: { xs: 2.5, md: 3 },
        width: "100%",
        maxWidth: 1240
      }}
    >
      <Box
        sx={{
          flex: { md: "1 1 0" },
          minWidth: 0,
          maxWidth: { md: aside ? 720 : 640 },
          width: "100%"
        }}
      >
        {hint ? (
          <Alert severity="info" variant="outlined" sx={{ mb: 2.5, borderRadius: 2, alignItems: "flex-start" }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
              {hintTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              {hint}
            </Typography>
          </Alert>
        ) : null}
        {children}
      </Box>
      {aside ? (
        <Box
          sx={{
            flex: { md: "0 0 clamp(260px, 28vw, 320px)" },
            width: { xs: "100%", md: "auto" },
            alignSelf: "stretch",
            position: { md: "sticky" },
            top: { md: 80 },
            zIndex: 1
          }}
        >
          {aside}
        </Box>
      ) : null}
    </Box>
  </Box>
);

export const AdminFormSection = ({ title, description, sectionId, children }) => (
  <Paper
    id={sectionId}
    variant="outlined"
    sx={(theme) => ({
      p: { xs: 2, sm: 2.5 },
      mb: 2.5,
      borderRadius: 2,
      borderColor: "divider",
      bgcolor: theme.palette.mode === "light" ? "rgba(248, 250, 252, 0.9)" : undefined,
      boxShadow: "none",
      scrollMarginTop: { xs: theme.spacing(2), md: theme.spacing(10) }
    })}
  >
    <Typography
      component="h2"
      variant="subtitle2"
      sx={{
        fontWeight: 700,
        letterSpacing: "0.02em",
        color: "primary.dark",
        mb: description ? 0.5 : 1.25
      }}
    >
      {title}
    </Typography>
    {description ? (
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, lineHeight: 1.5 }}>
        {description}
      </Typography>
    ) : null}
    <StackLikeInputs>{children}</StackLikeInputs>
  </Paper>
);

const StackLikeInputs = ({ children }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 2,
      width: "100%",
      "& .MuiFormControl-root": { maxWidth: "100%" }
    }}
  >
    {children}
  </Box>
);
