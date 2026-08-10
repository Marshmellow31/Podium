/**
 * Design tokens - Forge's warm, Pixel-inspired interface system.
 *
 * Imported from the Agent Design project "Material Design 3 SaaS UI"
 * (`Forge.dc.html`). These are the single source of truth for colour, radius,
 * elevation and motion. Do not hardcode a hex anywhere else; add a token here.
 */

export const c = {
  /* surfaces */
  surface: '#FFF8E1',
  surfaceCard: '#FAFAFA',
  surfaceContainer: '#FAF0CA',
  surfaceField: '#F5EDCF',
  surfaceFieldHover: '#EFE3B8',
  surfaceRowHover: '#FFF4CE',
  surfaceNavHover: '#F6E9B9',

  /* lines */
  outline: '#DED6B8',
  outlineSoft: '#EAE2C8',
  outlineStrong: '#8F8A78',
  outlineField: '#6A685F',

  /* text */
  ink: '#121212',
  inkBody: '#34322D',
  inkMuted: '#49473E',
  inkFaint: '#73736C',

  /* primary — amber */
  primary: '#FDE694',
  primaryHover: '#F7D873',
  onPrimary: '#121212',
  primaryContainer: '#FAF0CA',
  onPrimaryContainer: '#34322D',
  primaryInk: '#5D5119',
  primaryIcon: '#6A5A12',
  accent: '#F4CE46',

  /* inverse — the near-black used for high-emphasis buttons */
  inverse: '#121212',
  onInverse: '#FDE694',
  inverseSurface: '#2F2E2B',
  onInverseSurface: '#FAFAFA',

  /* status */
  success: '#90CEA1',
  onSuccess: '#102A18',
  successInk: '#176335',
  error: '#B3261E',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',
  errorInk: '#8C1D18',
  errorBody: '#5F1512',

  /* misc */
  track: '#E8DFC1',
  trackAlt: '#DAD0AD',
  scrim: 'rgba(18,18,18,.42)',
} as const;

/** Category cover colours, used for challenge card headers and list swatches. */
export const covers: Record<string, string> = {
  Photography: '#B9DFC3',
  Hackathon: '#FDE694',
  Wellness: '#D8D6A4',
  Design: '#E9C6A7',
  Data: '#B8D8E4',
  Community: '#E7BAB5',
  Pitch: '#CFC1E8',
};

export const coverFor = (category: string) => covers[category] ?? '#FAF0CA';

export const radius = {
  hero: 28,
  panel: 22,
  card: 16,
  tile: 14,
  row: 12,
  field: 12,
  chip: 10,
  pill: 999,
} as const;

export const shadow = {
  raised: '0 1px 2px rgba(23,23,20,.12),0 2px 6px rgba(23,23,20,.08)',
  hover: '0 8px 24px rgba(23,23,20,.10)',
  card: '0 16px 42px rgba(23,23,20,.12),0 2px 8px rgba(23,23,20,.06)',
  fab: '0 5px 14px rgba(23,23,20,.18),0 1px 4px rgba(23,23,20,.12)',
  fabHover: '0 10px 28px rgba(23,23,20,.22)',
  dialog: '0 24px 64px rgba(23,23,20,.24)',
  snack: '0 8px 28px rgba(23,23,20,.24)',
} as const;

/** M3 standard easing. Every transition in the design uses it. */
export const ease = 'cubic-bezier(.2,0,0,1)';
export const mono = "'IBM Plex Mono', monospace";

/** Status pill colours, keyed by the app's ChallengeStatus values. */
export const statusPill: Record<string, { bg: string; fg: string }> = {
  draft: { bg: c.surfaceField, fg: c.inkMuted },
  published: { bg: c.success, fg: c.onSuccess },
  running: { bg: c.primaryContainer, fg: c.onPrimaryContainer },
  judging: { bg: c.primary, fg: c.onPrimary },
  completed: { bg: c.surfaceField, fg: c.inkMuted },
  /* submission states */
  submitted: { bg: c.primaryContainer, fg: c.onPrimaryContainer },
  underReview: { bg: c.primary, fg: c.onPrimary },
  reviewed: { bg: c.success, fg: c.onSuccess },
  draftEntry: { bg: c.surfaceField, fg: c.inkMuted },
  /* registration states — the admin roster (ADR-025). `disqualified` is the
     only one in the error palette: it is the only one that is a *decision made
     about* the participant rather than a place they reached. */
  pending: { bg: c.surfaceField, fg: c.inkMuted },
  active: { bg: c.primaryContainer, fg: c.onPrimaryContainer },
  winner: { bg: c.success, fg: c.onSuccess },
  eliminated: { bg: c.surfaceField, fg: c.inkMuted },
  withdrawn: { bg: c.surfaceField, fg: c.inkMuted },
  disqualified: { bg: c.errorContainer, fg: c.errorInk },
  suspended: { bg: c.errorContainer, fg: c.errorInk },
};

export const pillFor = (status: string) =>
  statusPill[status] ?? { bg: c.surfaceField, fg: c.inkMuted };
