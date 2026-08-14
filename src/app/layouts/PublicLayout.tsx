import { Link, Outlet } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import { PodiumMark } from '@shared/ui/PodiumMark';
import { c } from '@shared/design/tokens';

/** Minimal chrome for routes that are intentionally available without an account. */
export default function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100vh', background: c.surface, color: c.ink }}>
      <Stack
        component="header"
        direction="row"
        alignItems="center"
        gap={1.25}
        sx={{ height: 72, maxWidth: 1320, mx: 'auto', px: { xs: 2.5, md: 5 } }}
      >
        <Stack
          component={Link}
          to="/"
          direction="row"
          alignItems="center"
          gap={1.25}
          sx={{ color: 'inherit', textDecoration: 'none' }}
        >
          <PodiumMark size={36} radius={12} />
          <Typography sx={{ fontSize: 22, fontWeight: 700 }}>Podium</Typography>
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Button component={Link} to="/discover" variant="text">Discover</Button>
        <Button component={Link} to="/signin" variant="contained">Sign in</Button>
      </Stack>
      <Box component="main" sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2.5, md: 5 }, py: { xs: 3, md: 4 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}
