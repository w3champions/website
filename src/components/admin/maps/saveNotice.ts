export interface SaveNotice {
  text: string;
  color: string;
}

/**
 * What to tell the admin after a write that landed.
 *
 * The page has a single snackbar, so a write and the refresh that follows it
 * cannot each have their own message: the second replaces the first, and the one
 * that gets lost is always the warning. They are reported together instead, and
 * a stale table stays a warning - the write itself is done, only the list behind
 * it is out of date, and re-doing the write is the wrong thing to try.
 */
export function saveNotice(saved: string, refreshError: string): SaveNotice {
  if (!refreshError) return { text: saved, color: "success" };
  return { text: `${saved} The map list could not be refreshed: ${refreshError}`, color: "warning" };
}
