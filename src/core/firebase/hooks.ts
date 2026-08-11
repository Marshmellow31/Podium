import { useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultOrgId } from './app';
import { qk } from './keys';
import * as q from './queries';
import { fetchChallengeSnapshot, hydrateFromChallenge } from './snapshot';

/**
 * Read hooks. Components use these; they never import `firebase/firestore`
 * (CONVENTIONS.md §5).
 *
 * This deployment reads from a configured default organization. When multi-org lands,
 * these take the active org from context — the query keys are already
 * org-first, so nothing below changes shape.
 */

export const useOrg = (orgId = defaultOrgId()) =>
  useQuery({ queryKey: qk.org(orgId), queryFn: () => q.fetchOrg(orgId) });

export const useWorkspaces = (orgId = defaultOrgId()) =>
  useQuery({ queryKey: qk.workspaces(orgId), queryFn: () => q.fetchWorkspaces(orgId) });

export const useChallenges = (orgId = defaultOrgId()) =>
  useQuery({ queryKey: qk.challenges(orgId), queryFn: () => q.fetchChallenges(orgId) });

export const usePublicChallenges = (orgId = defaultOrgId()) =>
  useQuery({ queryKey: [...qk.challenges(orgId), 'public'], queryFn: () => q.fetchPublicChallenges(orgId) });

export const useChallenge = (cid: string | undefined, orgId = defaultOrgId()) =>
  useQuery({
    queryKey: qk.challenge(orgId, cid ?? ''),
    queryFn: () => q.fetchChallenge(orgId, cid!),
    enabled: Boolean(cid),
  });

export const useChallengeBySlug = (slug: string | undefined, orgId = defaultOrgId()) =>
  useQuery({
    queryKey: qk.challengeBySlug(orgId, slug ?? ''),
    queryFn: () => q.fetchChallengeBySlug(orgId, slug!),
    enabled: Boolean(slug),
  });

export const useRegistrations = (cid: string | undefined, orgId = defaultOrgId()) =>
  useQuery({
    queryKey: qk.registrations(orgId, cid ?? ''),
    queryFn: () => q.fetchRegistrations(orgId, cid!),
    enabled: Boolean(cid),
  });

export const useSubmissions = (cid: string | undefined, orgId = defaultOrgId()) =>
  useQuery({
    queryKey: qk.submissions(orgId, cid ?? ''),
    queryFn: () => q.fetchSubmissions(orgId, cid!),
    enabled: Boolean(cid),
  });

export const useRubric = (cid: string | undefined, orgId = defaultOrgId()) =>
  useQuery({
    queryKey: qk.rubric(orgId, cid ?? ''),
    queryFn: () => q.fetchRubric(orgId, cid!),
    enabled: Boolean(cid),
  });

export const useLeaderboard = (cid: string | undefined, orgId = defaultOrgId()) =>
  useQuery({
    queryKey: qk.leaderboard(orgId, cid ?? ''),
    queryFn: () => q.fetchLeaderboard(orgId, cid!),
    enabled: Boolean(cid),
  });

export const useFormSchemas = (orgId = defaultOrgId()) =>
  useQuery({ queryKey: qk.formSchemas(orgId), queryFn: () => q.fetchFormSchemas(orgId) });

export const usePublishedFormSchemas = (orgId = defaultOrgId()) =>
  useQuery({ queryKey: [...qk.formSchemas(orgId), 'published'], queryFn: () => q.fetchPublishedFormSchemas(orgId) });

export const useMembers = (orgId = defaultOrgId()) =>
  useQuery({ queryKey: qk.members(orgId), queryFn: () => q.fetchMembers(orgId) });

export const useAuditLog = (orgId = defaultOrgId()) =>
  useQuery({ queryKey: qk.auditLog(orgId), queryFn: () => q.fetchAuditLog(orgId) });

export const useBadges = (earnedIds: string[] = [], orgId = defaultOrgId()) =>
  useQuery({ queryKey: qk.badges(orgId), queryFn: () => q.fetchBadges(orgId, earnedIds) });

export const useCertificates = () =>
  useQuery({ queryKey: qk.certificates(), queryFn: () => q.fetchCertificates() });

export const useMyCertificates = (userId: string | undefined) =>
  useQuery({
    queryKey: qk.certificates(userId ?? ''),
    queryFn: () => q.fetchMyCertificates(userId!),
    enabled: Boolean(userId),
  });

export const useCurrentUser = (userId: string | undefined) =>
  useQuery({
    queryKey: qk.user(userId ?? ''),
    queryFn: () => q.fetchUser(userId!),
    enabled: Boolean(userId),
  });

export const useMember = (userId: string | undefined, orgId = defaultOrgId()) =>
  useQuery({
    queryKey: qk.member(orgId, userId ?? ''),
    queryFn: () => q.fetchMember(orgId, userId!),
    enabled: Boolean(userId),
  });

export const useRoles = (orgId = defaultOrgId()) =>
  useQuery({ queryKey: qk.roles(orgId), queryFn: () => q.fetchRoles(orgId) });

export const useInvites = (orgId = defaultOrgId()) =>
  useQuery({ queryKey: qk.invites(orgId), queryFn: () => q.fetchInvites(orgId) });

export const useWebhooks = (orgId = defaultOrgId()) =>
  useQuery({ queryKey: qk.webhooks(orgId), queryFn: () => q.fetchWebhooks(orgId) });

export const useVotes = (cid: string | undefined, userId?: string, orgId = defaultOrgId()) =>
  useQuery({
    queryKey: qk.votes(orgId, cid ?? ''),
    queryFn: () => q.fetchVotes(orgId, cid!, userId),
    enabled: Boolean(cid),
    staleTime: 30_000,
  });

export const useNotifications = (userId: string | undefined, orgId = defaultOrgId()) =>
  useQuery({
    queryKey: qk.notifications(orgId, userId ?? ''),
    queryFn: () => q.fetchNotifications(orgId, userId!),
    enabled: Boolean(userId),
    // The inbox is the one thing a person expects to be current.
    staleTime: 60_000,
  });

export const useMyRegistrations = (userId: string | undefined, orgId = defaultOrgId()) =>
  useQuery({
    queryKey: qk.myRegistrations(orgId, userId ?? ''),
    queryFn: () => q.fetchMyRegistrations(orgId, userId!),
    enabled: Boolean(userId),
  });

/**
 * The whole participant roster, for the admin console.
 *
 * Reads the challenge list first because the fan-out needs the ids and the rows
 * need the titles — and because that list is already cached on every screen
 * that would ask for this, so it usually costs nothing extra.
 */
export const useAllRegistrations = (orgId = defaultOrgId()) => {
  const { data: challenges = [], isLoading: challengesLoading } = useChallenges(orgId);
  const lite = challenges.map((ch) => ({ id: ch.id, title: ch.title }));

  const result = useQuery({
    queryKey: qk.allRegistrations(orgId, lite.map((ch) => ch.id)),
    queryFn: () => q.fetchAllRegistrations(orgId, lite),
    // An organization with no challenges has no registrations, and firing the
    // query anyway would resolve to `[]` while reporting a load that never
    // happened.
    enabled: !challengesLoading,
  });

  return { ...result, isLoading: challengesLoading || result.isLoading };
};

/**
 * Hydrates the four per-challenge collections from one pre-joined document.
 *
 * The control room alone costs ~44 document reads if registrations,
 * submissions, rubric and leaderboard are each queried; this makes it 1.
 * Call it before the individual hooks on any screen that needs several of
 * them — they will then read straight from the cache it fills.
 */
export function useChallengeSnapshot(cid: string | undefined, orgId = defaultOrgId()) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['org', orgId, 'challenge', cid ?? '', 'snapshot'],
    enabled: Boolean(cid),
    queryFn: async () => {
      const snap = await fetchChallengeSnapshot(cid!, orgId);
      if (snap) hydrateFromChallenge(qc, cid!, snap, orgId);
      return snap ?? null;
    },
  });
}
