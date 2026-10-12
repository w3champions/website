import { HttpError } from "@/services/http/AuthorizedClient";

interface ErrorBody {
  error?: unknown;
  battleTags?: unknown;
}

function parseBody(text: string): ErrorBody | null {
  try {
    const value = JSON.parse(text) as unknown;
    return typeof value === "object" && value !== null ? value : null;
  } catch {
    return null;
  }
}

/** Admin-facing text for a failed network diagnostics call (C6 errors are `{ "error": "…" }`). */
export function describeNetDiagError(e: unknown): string {
  if (!(e instanceof HttpError)) return e instanceof Error ? e.message : String(e);
  const body = parseBody(e.responseBody);
  const code = typeof body?.error === "string" ? body.error : "";
  const rawTags: unknown = body?.battleTags;
  if (code === "unknown_battletags" && Array.isArray(rawTags)) {
    const tags = rawTags.filter((tag): tag is string => typeof tag === "string");
    return `Unknown players: ${tags.join(", ")}`;
  }
  switch (e.status) {
    case 400:
      return code !== "" ? `Rejected: ${code}` : "The request was rejected.";
    case 401:
      return "Your session has expired. Log in again.";
    case 403:
      return "You need the Proxies permission for network diagnostics.";
    case 404:
      return "Not found.";
    case 409:
      return code !== "" ? `Conflict: ${code}` : "This run is already cancelled.";
    case 502:
      return "The matchmaking service could not be reached. Try again.";
    default:
      return `Request failed (HTTP ${e.status}).`;
  }
}
