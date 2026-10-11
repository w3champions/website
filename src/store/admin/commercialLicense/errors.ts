import { HttpError } from "@/services/http/AuthorizedClient";

function reasonOf(body: string): string | undefined {
  try {
    const reason = (JSON.parse(body) as { error?: unknown } | null)?.error;
    return typeof reason === "string" && reason !== "" ? reason : undefined;
  } catch {
    // Body is not JSON; the caller falls back to the generic message.
    return undefined;
  }
}

/**
 * Turns a failed request into a message for the admin. website-backend answers
 * errors as `{ "error": "<reason>" }`, which HttpError carries in `responseBody`.
 * Its permission filter answers 401: missing permission, or `AUTH_TOKEN_EXPIRED`.
 */
export function describeError(e: unknown): string {
  if (!(e instanceof HttpError)) return e instanceof Error ? e.message : String(e);
  const reason = reasonOf(e.responseBody);
  if (e.status === 401 || e.status === 403) {
    return reason === "AUTH_TOKEN_EXPIRED" ? "Your session has expired. Log in again." : "You don't have the CommercialLicense permission.";
  }
  return reason ?? `Request failed (HTTP ${e.status})`;
}
