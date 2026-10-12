import { HttpError } from "@/services/http/AuthorizedClient";

/** The text for the page: the `error` of the backend answer, or the status when the answer has none. */
export function replayExportError(e: unknown): string {
  if (!(e instanceof HttpError)) return e instanceof Error ? e.message : String(e);
  try {
    const body = JSON.parse(e.responseBody);
    const text = body?.error ?? body?.Error;
    if (typeof text === "string" && text !== "") return text;
  } catch {
    // Not JSON, for example a proxy error page.
  }
  return `Request failed (${e.status})`;
}
