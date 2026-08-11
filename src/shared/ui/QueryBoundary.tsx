import type { ReactNode } from 'react';
import { Box, Stack } from '@mui/material';
import { motion } from 'motion/react';
import { Icon } from '@shared/ui/Icon';
import { c, radius } from '@shared/design/tokens';
import { softSpring, surfaceMotion } from './motion';

/**
 * The three states every remote read has. Screens render this instead of
 * hand-rolling a spinner, so "loading" and "permission denied" never get
 * mistaken for "empty" — the failure mode that makes a demo look broken
 * without saying why.
 */
export function QueryBoundary({
  isLoading,
  error,
  children,
  errorFallback,
  skeletonHeight = 120,
  skeletonRows = 3,
}: {
  isLoading: boolean;
  error?: unknown;
  children: ReactNode;
  errorFallback?: ReactNode;
  skeletonHeight?: number;
  skeletonRows?: number;
}) {
  if (isLoading) {
    return (
      <Stack spacing={2}>
        {Array.from({ length: skeletonRows }, (_, i) => (
          <Box
            key={i}
            component={motion.div}
            className="shimmer"
            variants={surfaceMotion}
            initial="initial"
            animate="animate"
            transition={{ ...softSpring, delay: i * 0.045 }}
            sx={{ height: skeletonHeight, borderRadius: `${radius.card}px` }}
          />
        ))}
      </Stack>
    );
  }

  if (error) {
    if (errorFallback) return <>{errorFallback}</>;

    const message = error instanceof Error ? error.message : String(error);
    const denied = /permission|insufficient/i.test(message);
    return (
      <Stack
        component={motion.div}
        variants={surfaceMotion}
        initial="initial"
        animate="animate"
        transition={softSpring}
        direction="row"
        gap={2}
        sx={{ p: 3, borderRadius: `${radius.card}px`, background: c.errorContainer, color: c.onErrorContainer }}
      >
        <Icon name={denied ? 'lock' : 'error'} size={24} color={c.errorInk} />
        <Box>
          <Box sx={{ fontSize: 15, fontWeight: 600, mb: 0.5 }}>
            {denied ? 'Not permitted to read this' : 'Could not load'}
          </Box>
          <Box sx={{ fontSize: 13, lineHeight: 1.55, color: c.errorBody }}>
            {denied
              ? 'Security rules rejected this read. Check that VITE_DEFAULT_ORG_ID matches the deployed organization and that firestore.rules is current.'
              : message}
          </Box>
        </Box>
      </Stack>
    );
  }

  return <>{children}</>;
}
