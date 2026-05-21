import { Box, Card, Skeleton, Stack } from "@mui/material";
import { DashGrid, DashGridItem } from "./DashGrid";

const SkelCard = () => (
  <Card sx={{ p: 2.5, borderRadius: 3 }}>
    <Stack direction="row" spacing={2}>
      <Skeleton variant="rounded" width={48} height={48} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="60%" height={20} />
        <Skeleton width="40%" height={36} sx={{ mt: 1 }} />
      </Box>
    </Stack>
  </Card>
);

export const DashboardSkeleton = () => (
  <Box>
    <Stack direction="row" justifyContent="space-between" sx={{ mb: 4 }}>
      <Box>
        <Skeleton width={280} height={40} />
        <Skeleton width={360} height={24} sx={{ mt: 1 }} />
      </Box>
      <Skeleton variant="rounded" width={140} height={40} />
    </Stack>
    <DashGrid spacing={2} sx={{ mb: 3 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <DashGridItem size={{ xs: 12, sm: 6, md: 3 }} key={i}>
          <SkelCard />
        </DashGridItem>
      ))}
    </DashGrid>
    <DashGrid spacing={3}>
      <DashGridItem size={{ xs: 12, lg: 8 }}>
        <Card sx={{ p: 2, borderRadius: 3, height: 380 }}>
          <Skeleton height="100%" />
        </Card>
      </DashGridItem>
      <DashGridItem size={{ xs: 12, lg: 4 }}>
        <Card sx={{ p: 2, borderRadius: 3, height: 380 }}>
          <Skeleton height="100%" />
        </Card>
      </DashGridItem>
    </DashGrid>
  </Box>
);
