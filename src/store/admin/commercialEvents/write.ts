import { HttpError } from "@/services/http/AuthorizedClient";
import { describeCommercialEventsError, type ErrorContext, MAYBE_SAVED_RELOAD_FAILED_TEXT, MAYBE_SAVED_TEXT, mayHaveBeenSaved } from "./errors";

/** The part of a store state that a write reports into. */
export interface WriteTarget {
  saving: boolean;
  error: string;
}

/**
 * Runs one admin write for a store: sets `saving` while it runs, clears `error`
 * first and fills it with the English message on failure (by form `context`, or
 * from a store's own describer). Never throws; returns
 * null on failure so callers can branch on the result.
 *
 * After a 5xx or a transport failure the write may still have been saved
 * (matchmaking can fail while building its response, website-backend answers
 * 504 when matchmaking is slow, a connection can drop after the request was
 * sent). With `refresh`, that case reloads the list and tells the admin to check
 * it before retrying, so a retry cannot silently duplicate the write. `saving`
 * stays set until the reload has finished, so the retry is only offered once the
 * list is current. `refresh` resolves to false when the reload failed; the admin
 * is then told to reload before trying again.
 */
export async function runAdminWrite<T>(
  target: WriteTarget,
  context: ErrorContext | ((e: unknown) => string),
  action: () => Promise<T>,
  refresh?: () => Promise<boolean>,
): Promise<T | null> {
  target.saving = true;
  target.error = "";
  try {
    return await action();
  } catch (e) {
    console.error("Admin request failed:", e instanceof HttpError ? `${e.message}: ${e.bodyPreview}` : e);
    if (refresh && mayHaveBeenSaved(e)) {
      // A failing reload must not fail the write handling; the stores report their own load errors.
      const reloaded = await Promise.resolve().then(refresh).catch((refreshError: unknown) => {
        console.error("Refresh after a failed write failed:", refreshError);
        return false;
      });
      target.error = reloaded ? MAYBE_SAVED_TEXT : MAYBE_SAVED_RELOAD_FAILED_TEXT;
    } else {
      target.error = typeof context === "function" ? context(e) : describeCommercialEventsError(e, context);
    }
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
