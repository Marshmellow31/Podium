import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Icon } from '@shared/ui/Icon';
import { PodiumMark } from '@shared/ui/PodiumMark';
import { useAuth, usePermissions } from '@core/auth';
import type { AppMode } from '@core/auth/mode';
import { c, radius, ease, shadow } from '@shared/design/tokens';

type Pathway = 'participant' | 'organizer' | 'demo';

interface StartPath {
  key: Pathway;
  mode: AppMode;
  title: string;
  body: string;
  icon: string;
  destination: string;
  needsAccount: boolean;
  steps: string[];
}

const START_PATHS: StartPath[] = [
  {
    key: 'participant',
    mode: 'participant',
    title: 'Enter competitions',
    body: 'Discover challenges, build submissions, get judged against rubrics, and earn verified certificates.',
    icon: 'military_tech',
    destination: '/home',
    needsAccount: true,
    steps: [
      'Find an open challenge in your area of interest',
      'Fill out the entry form and submit your project',
      'Track live review progress and leaderboard updates',
      'Receive public certificates and achievement badges',
    ],
  },
  {
    key: 'organizer',
    mode: 'organizer',
    title: 'Host & manage challenges',
    body: 'Create competitions, customize registration forms, configure rubrics, and coordinate judges.',
    icon: 'space_dashboard',
    destination: '/org',
    needsAccount: true,
    steps: [
      'Set up your organization workspace and invite your team',
      'Build custom entry forms with the visual question builder',
      'Define weighted evaluation rubrics and assign judges',
      'Publish certified results and automated leaderboards',
    ],
  },
  {
    key: 'demo',
    mode: 'participant',
    title: 'Explore without an account',
    body: 'Browse all open public challenges, inspect live leaderboards, and see how Podium works.',
    icon: 'travel_explore',
    destination: '/discover',
    needsAccount: false,
    steps: [
      'Explore active and upcoming public competitions',
      'Inspect stage timelines, entry requirements, and prizes',
      'Review public submissions and community vote entries',
      'Create an account when you are ready to participate',
    ],
  },
];

/**
 * S-00 — Onboarding / Welcome screen.
 *
 * Provides a clear 3-door entry to Podium:
 * 1. Participant ("Enter competitions") -> routes to /home (or /signin)
 * 2. Organizer ("Host & manage") -> routes to /org (or /signin?as=admin)
 * 3. Guest Explorer ("Explore without account") -> routes to /discover
 */
export default function Welcome() {
  const nav = useNavigate();
  const { user, busy, setMode } = useAuth();
  const { isAdmin, ready: permissionsReady } = usePermissions();
  const [selected, setSelected] = useState<Pathway>('participant');
  const [pending, setPending] = useState<Pathway | 'admin' | null>(null);

  const chosen = START_PATHS.find((path) => path.key === selected) ?? START_PATHS[0]!;

  const continueWith = (path: StartPath) => {
    setPending(path.key);
    setMode(path.mode);
    if (!user && path.needsAccount) {
      const query = path.mode === 'organizer' ? '?as=admin' : '';
      nav(`/signin${query}`);
      return;
    }
    nav(path.destination);
  };

  const explore = () => {
    setMode('participant');
    nav('/discover');
  };

  return (
    <Box sx={{ minHeight: '100vh', px: { xs: 2.5, sm: 4, md: 6 }, py: { xs: 3, md: 5 }, background: c.surface, color: c.ink }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 3, md: 5 } }}>
          <Stack component={Link} to="/" direction="row" alignItems="center" gap={1.25} sx={{ color: 'inherit', textDecoration: 'none' }}>
            <PodiumMark size={38} radius={12} />
            <Typography sx={{ fontSize: 22, fontWeight: 750, letterSpacing: 0 }}>Podium</Typography>
          </Stack>
          <Button component={Link} to={user ? '/home' : '/signin'} variant="text">
            {user ? 'Go to dashboard' : 'Already have an account? Sign in'}
          </Button>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: { xs: 3, lg: 4 },
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(380px, 1fr)' },
            alignItems: 'stretch',
          }}
        >
          {/* Choice selector */}
          <Box sx={{ p: { xs: 3, sm: 4, md: 4.5 }, borderRadius: `${radius.panel}px`, background: c.surfaceCard, border: `1px solid ${c.outline}`, boxShadow: shadow.raised }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.primaryInk, mb: 1.5 }}>
              Welcome to Podium
            </Typography>
            <Typography component="h1" sx={{ fontSize: { xs: 30, sm: 40 }, fontWeight: 750, lineHeight: 1.15, letterSpacing: 0, mb: 1.5 }}>
              How will you use Podium today?
            </Typography>
            <Typography sx={{ fontSize: 15, lineHeight: 1.6, color: c.inkMuted, mb: 3.5 }}>
              Select how you want to start. Your choice arranges your workspace navigation and can be switched at any time.
            </Typography>

            <Stack gap={1.5} sx={{ mb: 3.5 }}>
              {START_PATHS.map((path) => {
                const active = selected === path.key;
                return (
                  <Box
                    key={path.key}
                    component="button"
                    type="button"
                    onClick={() => setSelected(path.key)}
                    aria-pressed={active}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      p: 2.25,
                      borderRadius: `${radius.tile}px`,
                      border: `1.5px solid ${active ? c.accent : c.outlineSoft}`,
                      background: active ? c.primaryContainer : c.surfaceField,
                      color: c.ink,
                      textAlign: 'left',
                      font: 'inherit',
                      cursor: 'pointer',
                      boxShadow: active ? shadow.raised : 'none',
                      transition: `all 180ms ${ease}`,
                      '&:hover': { background: active ? c.primaryContainer : c.surfaceFieldHover },
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        flex: 'none',
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '12px',
                        background: active ? c.primary : c.surfaceCard,
                        color: active ? c.onPrimary : c.primaryIcon,
                      }}
                    >
                      <Icon name={path.icon} size={24} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 0.5 }}>{path.title}</Typography>
                      <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: c.inkMuted }}>{path.body}</Typography>
                    </Box>
                    <Icon
                      name={active ? 'check_circle' : 'radio_button_unchecked'}
                      size={22}
                      fill={active}
                      color={active ? c.accent : c.inkFaint}
                    />
                  </Box>
                );
              })}
            </Stack>

            <Button
              fullWidth
              variant="contained"
              disabled={busy}
              onClick={() => continueWith(chosen)}
              sx={{ height: 52, fontSize: 15 }}
              endIcon={pending === chosen.key ? <CircularProgress size={18} sx={{ color: c.onPrimary }} /> : <Icon name="arrow_forward" size={20} />}
            >
              {user
                ? `Open ${chosen.key === 'participant' ? 'participant home' : chosen.key === 'organizer' ? 'organization dashboard' : 'discovery'}`
                : chosen.key === 'demo'
                  ? 'Start browsing challenges'
                  : `Continue as ${chosen.key === 'organizer' ? 'organizer' : 'participant'}`}
            </Button>

            <Button fullWidth variant="text" onClick={explore} sx={{ mt: 1.25, color: c.inkMuted }}>
              Explore public challenges without signing in
            </Button>
          </Box>

          {/* Journey Preview */}
          <JourneyPreview path={chosen} />
        </Box>

        {permissionsReady && isAdmin && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            gap={1.5}
            sx={{ mt: 3.5, p: 2.5, borderRadius: `${radius.card}px`, background: c.surfaceCard, border: `1px solid ${c.outline}` }}
          >
            <Icon name="verified_user" size={24} color={c.primaryIcon} />
            <Typography sx={{ flex: 1, fontSize: 13.5, lineHeight: 1.55, color: c.inkMuted }}>
              You have administrator privileges on an active organization.
            </Typography>
            <Button
              variant="outlined"
              disabled={busy}
              onClick={() => {
                setPending('admin');
                setMode('organizer');
                nav('/admin');
              }}
              endIcon={pending === 'admin' ? <CircularProgress size={16} /> : <Icon name="arrow_forward" size={18} />}
            >
              Open Admin Console
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

function JourneyPreview({ path }: { path: StartPath }) {
  const isParticipant = path.key === 'participant';
  const isOrganizer = path.key === 'organizer';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 3, sm: 4, md: 4.5 },
        borderRadius: `${radius.panel}px`,
        background: isOrganizer ? c.inverse : c.surfaceCard,
        color: isOrganizer ? c.onInverse : c.ink,
        border: isOrganizer ? 'none' : `1px solid ${c.outline}`,
        transition: `background 220ms ${ease}, color 220ms ${ease}`,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3.5 }}>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: isOrganizer ? c.primary : c.primaryInk }}>
            Your journey
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 20, fontWeight: 750 }}>
            {isParticipant ? 'From registration to certificate' : isOrganizer ? 'From competition design to published awards' : 'Fast preview of live competitions'}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '12px',
            background: isOrganizer ? 'rgba(255,241,185,.14)' : c.primaryContainer,
          }}
        >
          <Icon name={path.icon} size={24} color={isOrganizer ? c.primary : c.primaryIcon} />
        </Box>
      </Stack>

      <Stack gap={1.5} sx={{ flex: 1 }}>
        {path.steps.map((step, index) => (
          <Stack
            key={step}
            direction="row"
            alignItems="center"
            gap={1.75}
            sx={{
              p: 2,
              borderRadius: `${radius.tile}px`,
              background: isOrganizer ? 'rgba(255,255,255,.07)' : index === 0 ? c.primaryContainer : c.surfaceContainer,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                flex: 'none',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '10px',
                background: isOrganizer ? 'rgba(255,241,185,.14)' : c.surfaceCard,
                color: isOrganizer ? c.primary : c.primaryInk,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {index + 1}
            </Box>
            <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{step}</Typography>
            <Icon
              name={index === path.steps.length - 1 ? 'flag' : 'arrow_downward'}
              size={18}
              color={isOrganizer ? c.primary : c.inkFaint}
            />
          </Stack>
        ))}
      </Stack>

      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: `${radius.tile}px`,
          background: isOrganizer ? 'rgba(205,227,203,.12)' : c.surfaceContainer,
          border: isOrganizer ? 'none' : `1px solid ${c.outlineSoft}`,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Icon name="verified" size={20} color={isOrganizer ? c.primary : c.successInk} />
          <Typography sx={{ fontSize: 13, lineHeight: 1.5 }}>
            {isParticipant
              ? 'Results, submissions, and verification ids stay attached to your profile permanently.'
              : isOrganizer
                ? 'Multi-tenant isolation and security rules protect your evaluations and entries.'
                : 'Browse challenges with zero sign-up barrier.'}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
