import { HttpError } from "@/services/http/AuthorizedClient";
import { describeCommercialEventsError, type ErrorContext, MAYBE_SAVED_TEXT, mayHaveBeenSaved } from "./errors";

/** The part of a store state that a write reports into. */
export interface WriteTarget {
  saving: boolean;
  error: string;
}

/**
 * Runs one admin write for a store: sets `saving` while it runs, clears `error`
 * first and fills it with the English message on failure. Never throws; returns
 * null on failure so callers can branch on the result.
 *
 * After a 5xx or a transport failure the write may still have been saved
 * (matchmaking can fail while building its response, website-backend answers
 * 504 when matchmaking is slow, a connection can drop after the request was
 * sent). With `refresh`, that case reloads the list and tells the admin to check
 * it before retrying, so a retry cannot silently duplicate the write. `saving`
 * stays set until the reload has finished, so the retry is only offered once the
 * list is current.
 */
export async function runAdminWrite<T>(target: WriteTarget, context: ErrorContext, action: () => Promise<T>, refresh?: () => unknown): Promise<T | null> {
  target.saving = true;
  target.error = "";
  try {
    return await action();
  } catch (e) {
    console.error("Commercial events request failed:", e instanceof HttpError ? `${e.message}: ${e.bodyPreview}` : e);
    if (refresh && mayHaveBeenSaved(e)) {
      // A failing reload must not fail the write handling; the stores report their own load errors.
      await Promise.resolve().then(refresh).catch((refreshError: unknown) => console.error("Refresh after a failed write failed:", refreshError));
      target.error = MAYBE_SAVED_TEXT;
    } else {
      target.error = describeCommercialEventsError(e, context);
    }
    return null;
  } finally {
    target.saving = false;
  }
}
