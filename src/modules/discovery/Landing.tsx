import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useAuth } from '@core/auth';
import { usePublicChallenges } from '@core/firebase/hooks';
import { Icon } from '@shared/ui/Icon';
import { PodiumMark } from '@shared/ui/PodiumMark';
import { c, coverFor, radius, shadow } from '@shared/design/tokens';
import type { Challenge } from '@shared/types/domain';

const isRunning = (challenge: Challenge) =>
  challenge.status === 'running'
  || (challenge.status === 'published'
    && new Date(challenge.timeline.registrationClosesAt).getTime() > Date.now());

export default function Landing() {
  const { user, ready, mode } = useAuth();
  const { data: challenges = [], isLoading } = usePublicChallenges();
  const running = useMemo(() => challenges.filter(isRunning).slice(0, 4), [challenges]);

  if (ready && user) {
    return <Navigate to={mode === 'organizer' ? '/org' : '/home'} replace />;
  }

  return (
    <Box sx={{ minHeight: '100vh', background: c.surface, color: c.ink }}>
      <Header />
      <Box component="main" sx={{ width: '100%', maxWidth: 980, mx: 'auto', px: { xs: 2.5, sm: 4 }, pb: { xs: 6, md: 9 } }}>
        <Stack alignItems="center" textAlign="center" sx={{ py: { xs: 7, md: 10 } }}>
          <Typography component="h1" sx={{ fontSize: { xs: 36, md: 52 }, fontWeight: 750, lineHeight: 1.12, letterSpacing: '-0.02em' }}>
            The Operating System for Challenges
          </Typography>
          <Typography sx={{ maxWidth: 580, mt: 2, color: c.inkMuted, fontSize: { xs: 15, md: 17.5 }, lineHeight: 1.6 }}>
            Run hackathons, creative contests, and innovation sprints with visual form builders, weighted rubric evaluations, and verifiable credentials.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, mt: 3.5 }}>
            <Button component={Link} to="/welcome" variant="contained" size="large" startIcon={<Icon name="explore" size={20} />} sx={{ minWidth: 190, height: 50 }}>
              Get started
            </Button>
            <Button component={Link} to="/discover" variant="outlined" size="large" startIcon={<Icon name="search" size={20} />} sx={{ minWidth: 190, height: 50 }}>
              Browse challenges
            </Button>
            <Button component={Link} to="/signin" variant="text" size="large" startIcon={<Icon name="login" size={20} />}>
              Sign in
            </Button>
          </Stack>
        </Stack>

        <Box component="section" aria-labelledby="running-heading">
          <Typography variant="overline">Open now</Typography>
          <Typography id="running-heading" component="h2" sx={{ mt: 0.75, fontSize: { xs: 30, md: 36 }, fontWeight: 650 }}>
            Running competitions
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
              <CircularProgress size={26} sx={{ color: c.accent }} />
            </Box>
          ) : running.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" textAlign="center" sx={{ minHeight: 330, mt: 3, px: 3, borderRadius: `${radius.panel}px`, background: c.primaryContainer, overflow: 'hidden', position: 'relative' }}>
              <Icon name="event_busy" size={48} color={c.primaryInk} />
              <Typography sx={{ mt: 2, fontSize: { xs: 21, md: 23 }, fontWeight: 650 }}>No competitions are open right now</Typography>
              <Typography sx={{ maxWidth: 440, mt: 1, color: c.inkMuted, lineHeight: 1.6 }}>Check back soon. New competitions will appear here as soon as they are published.</Typography>
              <Box sx={{ position: 'absolute', right: -36, bottom: -46, width: 160, height: 140, borderRadius: '50% 50% 0 0', background: c.success, opacity: 0.72 }} />
            </Stack>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,minmax(0,1fr))' }, gap: 1.5, mt: 3 }}>
              {running.map((challenge) => <CompetitionSummary key={challenge.id} challenge={challenge} />)}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function Header() {
  return (
    <Stack component="header" direction="row" alignItems="center" sx={{ maxWidth: 1120, height: 72, mx: 'auto', px: { xs: 2.5, sm: 4 } }}>
      <Stack component={Link} to="/" direction="row" alignItems="center" gap={1.2} sx={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
        <PodiumMark size={36} radius={12} />
        <Typography sx={{ fontSize: 22, fontWeight: 750, letterSpacing: 0 }}>Podium</Typography>
      </Stack>
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Button component={Link} to="/discover" variant="text" size="small">Discover</Button>
        <Button component={Link} to="/welcome" variant="text" size="small">How it works</Button>
        <Button component={Link} to="/signin" variant="outlined" size="small">Sign in</Button>
      </Stack>
    </Stack>
  );
}

function CompetitionSummary({ challenge }: { challenge: Challenge }) {
  return (
    <Stack direction="row" alignItems="center" gap={1.75} sx={{ minHeight: 88, p: 2, borderRadius: `${radius.tile}px`, background: c.surfaceCard, border: `1px solid ${c.outline}`, boxShadow: shadow.raised }}>
      <Box sx={{ width: 52, height: 52, flex: 'none', display: 'grid', placeItems: 'center', borderRadius: '16px', background: coverFor(challenge.category) }}>
        <Icon name="emoji_events" size={25} color={c.inkBody} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontSize: 16, fontWeight: 650 }}>{challenge.title}</Typography>
        <Typography noWrap sx={{ mt: 0.4, fontSize: 13, color: c.inkMuted }}>{challenge.category}</Typography>
      </Box>
      <Box aria-label="Running" sx={{ width: 9, height: 9, borderRadius: '50%', background: c.successInk }} />
    </Stack>
  );
}
