import { HttpError } from "@/services/http/AuthorizedClient";

/** The text when the token expired. The page shows a Sign in button with it. */
export const SIGN_IN_EXPIRED = "Your sign-in has expired. Sign in again.";

/** The text for the page: the `error` of the backend answer, or the status when the answer has none. */
export function replayExportError(e: unknown): string {
  if (!(e instanceof HttpError)) return e instanceof Error ? e.message : String(e);
  try {
    const body = JSON.parse(e.responseBody);
    const text = body?.error ?? body?.Error;
    // A code, not a text: the token of the signed-in user expired.
    if (text === "AUTH_TOKEN_EXPIRED") return SIGN_IN_EXPIRED;
    if (typeof text === "string" && text !== "") return text;
  } catch {
    // Not JSON, for example a proxy error page.
  }
  return `Request failed (${e.status})`;
}
