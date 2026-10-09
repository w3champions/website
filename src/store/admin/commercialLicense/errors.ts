import { HttpError } from "@/services/http/AuthorizedClient";

/**
 * Turns a failed request into a message for the admin. website-backend answers
 * errors as `{ "error": "<reason>" }`, which HttpError carries in `responseBody`.
 */
export function describeError(e: unknown): string {
  if (!(e instanceof HttpError)) return e instanceof Error ? e.message : String(e);
  if (e.status === 403) return "You don't have the CommercialLicense permission.";
  try {
    const reason = (JSON.parse(e.responseBody) as { error?: unknown } | null)?.error;
    if (typeof reason === "string" && reason !== "") return reason;
  } catch {
    // Body is not JSON; fall through to the generic message.
  }
  return `Request failed (HTTP ${e.status})`;
}
