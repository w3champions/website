import { HttpError } from "@/services/http/AuthorizedClient";

interface ErrorBody {
  error?: unknown;
  battleTags?: unknown;
  targetKeys?: unknown;
  floNodeIds?: unknown;
}

function parseBody(text: string): ErrorBody | null {
  try {
    const value = JSON.parse(text) as unknown;
    return typeof value === "object" && value !== null ? value : null;
  } catch {
    return null;
  }
}

const PERMISSION_MISSING = "Permission missing.";
const PROXIES_MISSING = "You need the Proxies permission for network diagnostics.";
const ALREADY_CANCELLED = "already_cancelled";
/** 503 body of a read that ran into the backend's query time limit. */
const QUERY_TIMEOUT = "query_timeout";

/** The 400 bodies that name the rejected values: shown as plain text, the way the backend returned them. */
const UNKNOWN_LISTS: ReadonlyArray<{ code: string; field: "battleTags" | "targetKeys" | "floNodeIds"; label: string; numeric: boolean }> = [
  { code: "unknown_battletags", field: "battleTags", label: "Unknown players", numeric: false },
  { code: "unknown_targets", field: "targetKeys", label: "Unknown targets", numeric: false },
  { code: "unknown_flo_nodes", field: "floNodeIds", label: "Unknown flo nodes", numeric: true },
];

function unknownListMessage(code: string, body: ErrorBody | null): string | null {
  const entry = UNKNOWN_LISTS.find((candidate) => candidate.code === code);
  const raw: unknown = entry === undefined ? undefined : body?.[entry.field];
  if (entry === undefined || !Array.isArray(raw)) return null;
  const values = raw.filter((value): value is string | number => (entry.numeric ? typeof value === "number" : typeof value === "string"));
  return values.length > 0 ? `${entry.label}: ${values.join(", ")}` : null;
}

function genericMessage(status: number): string {
  return `Request failed (HTTP ${status}).`;
}

/** Admin-facing text for a failed network diagnostics call (C6 errors are `{ "error": "…" }`). */
export function describeNetDiagError(e: unknown): string {
  if (!(e instanceof HttpError)) return e instanceof Error ? e.message : String(e);
  const body = parseBody(e.responseBody);
  const code = typeof body?.error === "string" ? body.error : "";
  const unknown = unknownListMessage(code, body);
  if (unknown !== null) return unknown;
  switch (e.status) {
    case 400:
      return code !== "" ? `Rejected: ${code}` : "The request was rejected.";
    case 401:
      // The backend answers a missing permission with 401 too; only the body tells it from an expired token.
      return code === PERMISSION_MISSING ? PROXIES_MISSING : "Your session has expired. Log in again.";
    case 403:
      return PROXIES_MISSING;
    case 404:
      return "Not found.";
    case 409:
      return code !== "" && code !== ALREADY_CANCELLED ? `Conflict: ${code}` : "This run is already cancelled.";
    case 502:
      return "The matchmaking service could not be reached. Try again.";
    case 503:
      return code === QUERY_TIMEOUT ? "The query took too long. Narrow the filters or the time range and try again." : genericMessage(e.status);
    default:
      return genericMessage(e.status);
  }
}
