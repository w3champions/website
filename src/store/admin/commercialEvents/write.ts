import { describeCommercialEventsError, type ErrorContext } from "./errors";

/** The part of a store state that a write reports into. */
export interface WriteTarget {
  saving: boolean;
  error: string;
}

/**
 * Runs one admin write for a store: sets `saving` while it runs, clears `error`
 * first and fills it with the English message on failure. Never throws; returns
 * null on failure so callers can branch on the result.
 */
export async function runAdminWrite<T>(target: WriteTarget, context: ErrorContext, action: () => Promise<T>): Promise<T | null> {
  target.saving = true;
  target.error = "";
  try {
    return await action();
  } catch (e) {
    console.error("Commercial events request failed:", e);
    target.error = describeCommercialEventsError(e, context);
    return null;
  } finally {
    target.saving = false;
  }
}
