/**
 * Which door someone came in through.
 *
 * Podium serves two genuinely different people through one deployment:
 *
 *   • a **participant** — enters challenges, submits work, checks results;
 *   • an **organizer** — creates challenges, frames the questions, judges.
 *
 * They are not different *accounts* — the same person is often both, and
 * splitting the identity would mean two sign-ins and a migration the day
 * someone is promoted. What differs is the **surface**: showing a participant
 * an "Organizing" nav group full of screens that will refuse them is worse
 * than useless, because a permission-denied screen reads as a broken app.
 *
 * So the mode is a *view preference*, chosen by the sign-in door and persisted
 * locally. It never grants anything — permissions come from
 * `core/rbac` and are enforced by security rules. Choosing "organizer" on a
 * fresh account shows you the organizing surface and an empty state inviting
 * you to create an organization; it does not make you one.
 */

export type AppMode = 'participant' | 'organizer';

const KEY = 'podium.mode';

export function readMode(): AppMode | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'participant' || value === 'organizer' ? value : null;
  } catch {
    // Private browsing or a blocked storage partition. Not having a preference
    // is a perfectly good state — the next sign-in selects it again.
    return null;
  }
}

export function writeMode(mode: AppMode): void {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* the session still works, it just will not be remembered */
  }
}

export function clearMode(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

/** Where each signed-in mode belongs. */
export const HOME_FOR: Record<AppMode, string> = {
  participant: '/home',
  organizer: '/org',
};
