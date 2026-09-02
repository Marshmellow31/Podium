import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material';
import { Icon } from '@shared/ui/Icon';
import { PageTitle, StatusPill, EmptyState, Num, liftSx } from '@shared/ui/primitives';
import { c, radius, coverFor } from '@shared/design/tokens';
import { useMyRegistrations, usePublicChallenges } from '@core/firebase/hooks';
import { useAuth } from '@core/auth';
import { QueryBoundary } from '@shared/ui/QueryBoundary';

/** S-55 — My entries. */

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'judged', label: 'Judged' },
  { key: 'archived', label: 'Archived' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const CATEGORY_ICON: Record<string, string> = {
  Photography: 'photo_camera',
  Hackathon: 'code',
  Wellness: 'directions_run',
  Design: 'draw',
  Community: 'forum',
  Data: 'insights',
  Pitch: 'campaign',
};

export default function MyEntries() {
  const [tab, setTab] = useState<TabKey>('active');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: registrations = [], isLoading, error } = useMyRegistrations(user?.uid);
  const { data: publicChallenges = [] } = usePublicChallenges();
  const challengeById = useMemo(
    () => new Map(publicChallenges.map((ch) => [ch.id, ch])),
    [publicChallenges],
  );

  const rows = registrations.filter((entry) => {
    if (tab === 'active') return entry.status === 'pending' || entry.status === 'active';
    if (tab === 'judged') return entry.status === 'winner' || entry.status === 'eliminated';
    if (tab === 'archived') return entry.status === 'withdrawn' || entry.status === 'disqualified';
    return false;
  });

  return (
    <>
      <PageTitle>My entries</PageTitle>

      <Tabs value={tab} onChange={(_, v: TabKey) => setTab(v)} variant="scrollable" sx={{ mb: 3 }}>
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>

      <QueryBoundary isLoading={isLoading} error={error}>
      {rows.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="Nothing here yet"
          body={tab === 'active'
            ? 'Entries appear here after you register for a challenge.'
            : 'Finished entries and placements collect here.'}
          action={<Button variant="contained" component={Link} to="/discover">Find a challenge</Button>}
        />
      ) : (
        <Stack spacing={1.5}>
          {rows.map((entry) => {
            const challenge = challengeById.get(entry.challengeId);
            return (
            <Box
              key={entry.id}
              onClick={() => challenge && navigate(`/c/${challenge.slug}`)}
              sx={{
                ...liftSx,
                display: 'flex',
                gap: 2.25,
                alignItems: 'center',
                flexWrap: 'wrap',
                borderRadius: `${radius.card}px`,
                background: c.surfaceCard,
                border: `1px solid ${c.outline}`,
                p: 2.5,
                '&:hover': { boxShadow: '0 4px 14px rgba(60,50,10,.09)', transform: 'translateY(-2px)' },
                cursor: challenge ? 'pointer' : 'default',
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  flex: 'none',
                  borderRadius: `${radius.field}px`,
                  display: 'grid',
                  placeItems: 'center',
                  background: coverFor(challenge?.category ?? 'Community'),
                }}
              >
                <Icon name={CATEGORY_ICON[challenge?.category ?? ''] ?? 'emoji_events'} size={24} color={c.onPrimaryContainer} />
              </Box>

              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, letterSpacing: 0, mb: 0.5 }}>
                  {challenge?.title ?? `Challenge ${entry.challengeId}`}
                </Typography>
                <Typography sx={{ fontSize: 13, color: c.inkMuted }}>
                  Registered {entry.registeredAt} · stage {entry.currentStageKey}
                </Typography>
              </Box>

              <StatusPill status={entry.status} />

              <Box sx={{ textAlign: 'right', minWidth: 88 }}>
                <Typography sx={{ fontSize: 18, fontWeight: 700, letterSpacing: 0 }}>
                  <Num size={18}>{entry.checkedIn ? 'In' : '—'}</Num>
                </Typography>
                <Typography sx={{ fontSize: 11, color: c.inkFaint }}>
                  {entry.checkedIn ? 'checked in' : 'not checked in'}
                </Typography>
              </Box>

              <Icon name="chevron_right" size={22} color={c.inkFaint} />
            </Box>
            );
          })}
        </Stack>
      )}
      </QueryBoundary>
    </>
  );
}
