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

export interface FailedSaveInput {
  /** What the failure itself said. */
  error: string;
  /** True when the request timed out, so the write may still have been applied. */
  outcomeUnknown: boolean;
  /** True for a create, which is the one write that is not safe to repeat. */
  isCreate: boolean;
  /** The name the map was being saved under. */
  mapName: string;
  /** Map names as they read after the refresh. */
  mapNames: string[];
  /** What went wrong refreshing the list, or "" when it is up to date. */
  refreshError: string;
}

/**
 * What to tell the admin after a write that did not come back cleanly.
 *
 * A create is the only write here that cannot simply be repeated: a timed-out
 * POST may have made the map, and pressing Save again would make a second one.
 * The refreshed list answers that, so the notice says what it shows instead of
 * leaving the admin to guess. An update is idempotent, so its own message
 * already covers it.
 *
 * Everything goes in one string because the page has a single snackbar: a
 * second message would replace this one rather than join it.
 */
export function failedSaveNotice(input: FailedSaveInput): SaveNotice {
  const parts = [input.error];

  if (input.isCreate && input.outcomeUnknown && !input.refreshError) {
    const name = input.mapName.trim();
    const exists = !!name && input.mapNames.some((candidate) => candidate.trim() === name);
    parts.push(
      exists
        ? `A map named "${name}" is in the refreshed list, so it was created - do not save it again.`
        : `No map named "${name}" is in the refreshed list, so it was not created.`,
    );
  }

  if (input.refreshError) parts.push(`The map list could not be refreshed: ${input.refreshError}`);

  return { text: parts.join(" "), color: "error" };
}
