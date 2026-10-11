import { HttpError } from "@/services/http/AuthorizedClient";
import type { RequestSequence } from "./latest";
import { describeCommercialEventsError, type ErrorContext, isStateConflict, MAYBE_SAVED_RELOAD_FAILED_TEXT, MAYBE_SAVED_TEXT, mayHaveBeenSaved } from "./errors";

/** The part of a store state that a write reports into. */
export interface WriteTarget {
  saving: boolean;
  error: string;
}

/**
 * Why a write asks its store to reload:
 * - `uncertain`: a 5xx or a transport failure, the write may have been saved;
 * - `conflict`: refused because the server state changed (see `isStateConflict`);
 * - `elsewhere`: the write settled after its page visit ended, so the page now shown reloads instead of taking it.
 */
export type RefreshReason = "uncertain" | "conflict" | "elsewhere";

/**
 * Runs one admin write for a store: sets `saving` while it runs, clears `error`
 * first and fills it with the English message on failure (by form `context`, or
 * from a store's own describer). Never throws; returns null on failure, and
 * whenever the result must not be applied, so callers can branch on the result.
 *
 * After a 5xx or a transport failure the write may still have been saved
 * (matchmaking can fail while building its response, website-backend answers
 * 504 when matchmaking is slow, a connection can drop after the request was
 * sent). With `refresh`, that case reloads the list and tells the admin to check
 * it before retrying, so a retry cannot silently duplicate the write. `saving`
 * stays set until the reload has finished, so the retry is only offered once the
 * list is current. `refresh` resolves to false when the reload failed; the admin
 * is then told to reload before trying again. A refusal because the server state
 * changed also reloads (awaited), keeping its own message.
 *
 * With `visits`, the write belongs to the page visit current when it starts. Once
 * that visit has ended (the store's `endVisit()` or `clear()`), the write reports
 * nothing and its result is not applied (it returns null): the next page may
 * already show newer data. Instead, when it succeeded or may have, or hit a state
 * conflict, the store reloads what is shown now (`elsewhere`). `saving` still
 * waits for the write itself.
 */
export async function runAdminWrite<T>(
  target: WriteTarget,
  context: ErrorContext | ((e: unknown) => string),
  action: () => Promise<T>,
  refresh?: (reason: RefreshReason) => Promise<boolean>,
  visits?: RequestSequence,
): Promise<T | null> {
  const visit = visits?.current();
  const stillVisiting = () => visits === undefined || visit === undefined || visits.isLatest(visit);
  // A failing reload must not fail the write handling; the stores report their own load errors.
  const reload = (reason: RefreshReason): Promise<boolean> =>
    refresh === undefined
      ? Promise.resolve(true)
      : Promise.resolve(reason).then(refresh).catch((refreshError: unknown) => {
        console.error("Refresh after a failed write failed:", refreshError);
        return false;
      });
  target.saving = true;
  target.error = "";
  try {
    const result = await action();
    if (stillVisiting()) return result;
    void reload("elsewhere");
    return null;
  } catch (e) {
    console.error("Admin request failed:", e instanceof HttpError ? `${e.message}: ${e.bodyPreview}` : e);
    const uncertain = mayHaveBeenSaved(e);
    const conflict = !uncertain && isStateConflict(e);
    if (!stillVisiting()) {
      if (uncertain || conflict) void reload("elsewhere");
      return null;
    }
    if (refresh && uncertain) {
      const reloaded = await reload("uncertain");
      if (stillVisiting()) target.error = reloaded ? MAYBE_SAVED_TEXT : MAYBE_SAVED_RELOAD_FAILED_TEXT;
      return null;
    }
    target.error = typeof context === "function" ? context(e) : describeCommercialEventsError(e, context);
    if (conflict) await reload("conflict");
    return null;
  } finally {
    target.saving = false;
  }
}

/**
 * `$reset()` for a store that runs writes, keeping `saving`: a write still in flight
 * keeps targeting the store and clears `saving` when it settles, and resetting it
 * earlier would let a second write overlap the first.
 */
export function resetKeepingWrite(store: WriteTarget & { $reset(): void }): void {
  const saving = store.saving;
  store.$reset();
  store.saving = saving;
}
