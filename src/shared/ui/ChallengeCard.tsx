import { Link } from 'react-router-dom';
import { Box, Stack, Typography } from '@mui/material';
import { motion } from 'motion/react';
import { Icon } from './Icon';
import { CoverImage } from './CoverImage';
import { resolveCoverUrl } from '@core/drive/links';
import { c as t, radius } from '@shared/design/tokens';
import { quickSpring, surfaceMotion } from './motion';
import type { Challenge } from '@shared/types/domain';

/**
 * The challenge card, with the design's cover, blob and footer meta row.
 *
 * Lives in `shared/ui` rather than `modules/challenges` because three separate
 * modules render it — discovery, organizations and challenges — and a module
 * importing another module is the design smell AGENT.md calls out by name.
 * It is presentational over a shared domain type, which is exactly what
 * `shared/` is for.
 */
export function ChallengeCard({ challenge, to }: { challenge: Challenge; to: string }) {
  const ch = challenge;
  const hasPhoto = resolveCoverUrl(ch.cover) !== null;
  return (
    <Box
      component={motion.div}
      variants={surfaceMotion}
      initial="initial"
      animate="animate"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={quickSpring}
      sx={{ height: '100%' }}
    >
    <Box
      component={Link}
      to={to}
      sx={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        borderRadius: `${radius.card}px`,
        overflow: 'hidden',
        background: t.surfaceCard,
        border: `1px solid ${t.outline}`,
        height: '100%',
        transition: 'box-shadow 180ms',
        '&:hover': { boxShadow: '0 4px 14px rgba(60,50,10,.10)' },
      }}
    >
      <CoverImage cover={ch.cover} category={ch.category} height={112} width={640} alt="">
        {!hasPhoto && <Box sx={{ position: 'absolute', width: 160, height: 150, right: -46, top: -56, background: 'rgba(255,255,255,.32)', borderRadius: '52% 48% 60% 40%/45% 55% 45% 55%' }} />}
        <Box
          component="span"
          sx={{
            position: 'absolute',
            left: 16,
            bottom: 14,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0,
            textTransform: 'uppercase',
            color: t.onPrimaryContainer,
            background: 'rgba(255,253,246,.88)',
            px: 1.25,
            py: 0.6,
            borderRadius: '8px',
          }}
        >
          {ch.category}
        </Box>
      </CoverImage>

      <Box sx={{ p: '18px 20px 20px' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, letterSpacing: 0, mb: 1, lineHeight: 1.3 }}>
          {ch.title}
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            color: t.inkMuted,
            lineHeight: 1.5,
            mb: 2,
            minHeight: 39,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {ch.description}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ fontSize: 12, color: t.inkMuted }}>
          <Stack direction="row" alignItems="center" gap={0.75}>
            <Icon name="group" size={16} />
            {ch.counters.registrations} entrants
          </Stack>
          <Stack direction="row" alignItems="center" gap={0.75} sx={{ fontWeight: 600, color: t.primaryInk }}>
            <Icon name="schedule" size={16} />
            {ch.timeline.submissionClosesAt}
          </Stack>
        </Stack>
      </Box>
    </Box>
    </Box>
  );
}
