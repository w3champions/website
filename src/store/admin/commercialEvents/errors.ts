import { HttpError } from "@/services/http/AuthorizedClient";
import { formatUtc } from "./dates";
import { roleLabel } from "./format";
import type { InvalidFieldRule } from "./types";

/** Which form produced a field error; decides the length named for `too-long` on `name`. */
export type ErrorContext = "event" | "allocation" | "suspension" | "other";

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  kind: "Type",
  prizePoolUsd: "Prize pool",
  startsAt: "Start",
  endsAt: "End",
  maxGames: "Game limit",
  gamesPerPeriod: "Games per period",
  recurrence: "Recurrence",
  allowEventCreation: "Allow creating events",
  adminNote: "Admin note",
  suspensionMessage: "Message",
  role: "Role",
  allocationId: "Allocation",
  eventId: "Event",
  matchId: "Match",
  limit: "Limit",
  cursor: "Cursor",
  battleTag: "BattleTag",
  actingBattleTag: "Acting BattleTag",
  status: "Status",
  phase: "Phase",
  query: "Search audit log",
};

const ROLE_LABELS: Record<string, string> = { member: "Member", delegate: roleLabel("delegate"), host: roleLabel("host") };

const OUT_OF_RANGE: Record<string, string> = {
  prizePoolUsd: "Enter an amount from 0 to 10,000,000.",
  maxGames: "Enter a number from 1 to 10,000.",
  gamesPerPeriod: "Enter a number from 1 to 100,000.",
  limit: "Enter a number from 1 to 50.",
};

/** English admin copy for codes whose text needs no data (C-E2 error table). */
const CODE_TEXT: Record<string, string> = {
  NOT_AUTHORIZED: "You aren't allowed to do this.",
  READ_ONLY: "This event is read-only.",
  UNKNOWN_EVENT: "This event wasn't found.",
  UNKNOWN_ALLOCATION: "This allocation wasn't found.",
  EVENT_NOT_STARTED: "This event hasn't started yet.",
  EVENT_CLOSED: "This event is closed. Closed events can't be changed.",
  EVENT_NOT_SUSPENDED: "This event isn't suspended.",
  EVENT_LIMIT_REACHED: "This event has reached its game limit.",
  ALLOCATION_EMPTY: "No games are left in this allocation's current period.",
  HOST_NOT_AUTHORIZED: "The lobby host isn't an authorized host for this event.",
  ALLOCATION_IN_USE: "This allocation has been used and can't be deleted. Use End now instead.",
  UNKNOWN_GAME: "This game is no longer in progress.",
  INTERNAL: "Something went wrong in the matchmaking service. Please try again.",
};

/** Shown after a write whose outcome is unknown, once the list has been reloaded. */
export const MAYBE_SAVED_TEXT = "The change may have been saved. The list was refreshed — check it before trying again.";

/** Shown after a write whose outcome is unknown when reloading the list failed too. */
export const MAYBE_SAVED_RELOAD_FAILED_TEXT = "The change may have been saved, but the list couldn't be reloaded. Reload it and check before trying again.";

/**
 * True when a failed write may nevertheless have been applied: any 5xx (the
 * response, not necessarily the write, failed: matchmaking errors, gateway and
 * proxy timeouts such as 504 or 524), or any failure without an HTTP status
 * (fetch rejects with a TypeError when the connection drops, which can happen
 * after the server processed the request). Only a 4xx proves the write was refused.
 */
export function mayHaveBeenSaved(e: unknown): boolean {
  return !(e instanceof HttpError) || e.status >= 500;
}

/**
 * Error codes (matchmaking docs/commercial-events.md, "Error codes") that refuse a write because the server state is not
 * what the page showed: another admin or the clock changed it (closed at endsAt, suspended, lifted, deleted, used,
 * expired, a role added). The write was not applied, but the page should reload. Validation (`INVALID_FIELD`,
 * `INVALID_REQUEST`, `UNKNOWN_BATTLE_TAG`), permission (`NOT_AUTHORIZED`) and refusal (`TERMINATE_FAILED`) codes
 * are not state conflicts.
 */
const STATE_CONFLICT_CODES = new Set([
  "READ_ONLY",
  "UNKNOWN_EVENT",
  "UNKNOWN_ALLOCATION",
  "ROLE_EXISTS",
  "EVENT_NOT_STARTED",
  "EVENT_CLOSED",
  "EVENT_SUSPENDED",
  "EVENT_NOT_SUSPENDED",
  "ALLOCATION_INACTIVE",
  "EVENT_LIMIT_REACHED",
  "ALLOCATION_EMPTY",
  "HOST_NOT_AUTHORIZED",
  "ALLOCATION_IN_USE",
  "UNKNOWN_GAME",
]);

/** True for a refused write whose code says the page's data is out of date (see STATE_CONFLICT_CODES). */
export function isStateConflict(e: unknown): boolean {
  return e instanceof HttpError && e.status < 500 && STATE_CONFLICT_CODES.has(text(parseBody(e.responseBody).code) ?? "");
}

/**
 * After an uncertain allocation create whose reload lists exactly one new allocation of that name. It may also be
 * another admin's, so the dialog does not switch to editing it.
 */
export function allocationMaybeCreatedText(name: string): string {
  return `An allocation named "${name}" is listed now. It may be the one you just created (or another admin's): check the list before creating it again.`;
}

interface ErrorBody {
  error?: unknown;
  /** ASP.NET Core ProblemDetails (website-backend's own model-binding 400). */
  title?: unknown;
  code?: unknown;
  field?: unknown;
  rule?: unknown;
  data?: unknown;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function parseBody(raw: string): ErrorBody {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function dataOf(body: ErrorBody): Record<string, unknown> {
  return typeof body.data === "object" && body.data !== null ? body.data as Record<string, unknown> : {};
}

function fieldLabel(field: string | undefined): string {
  return field === undefined ? "Request" : FIELD_LABELS[field] ?? field;
}

function tooLongLimit(field: string, context: ErrorContext): number | null {
  if (field === "name") return context === "allocation" ? 60 : context === "event" ? 32 : null;
  if (field === "suspensionMessage") return 500;
  if (field === "adminNote") return 2000;
  return null;
}

/** English text for an INVALID_FIELD rule, without the field label; unknown rules are named as sent. */
export function ruleText(field: string, rule: InvalidFieldRule | (string & {}), context: ErrorContext = "other"): string {
  switch (rule) {
    case "required":
      return field === "suspensionMessage" ? "Enter a message." : field === "name" ? "Enter a name." : "Enter a value.";
    case "too-long": {
      const max = tooLongLimit(field, context);
      return max === null ? "The text is too long." : `Use at most ${max.toLocaleString("en-US")} characters.`;
    }
    case "invalid-enum":
      return "Choose one of the options.";
    case "not-integer":
      return "Enter a whole number.";
    case "out-of-range":
      return OUT_OF_RANGE[field] ?? "The value is out of range.";
    case "below-used":
      return "The game limit can't be lower than the games already used or in progress.";
    case "end-before-start":
      return "The end must be after the start.";
    case "too-long-duration":
      return "An event can last at most 28 days.";
    case "end-in-past":
      return "The end can't be in the past.";
    case "outside-allocation":
      return "The dates must be within the allocation's period.";
    case "start-fixed":
      return "The start can't be changed after the event has started.";
    case "not-acknowledged":
      return "The acknowledgement is required.";
    case "immutable":
      return "This can't be changed after the allocation has started.";
    default:
      return `Invalid value (${rule}).`;
  }
}

function codeText(code: string, body: ErrorBody, context: ErrorContext): string | undefined {
  const data = dataOf(body);
  const field = text(body.field);
  switch (code) {
    case "INVALID_FIELD":
      return `${fieldLabel(field)}: ${ruleText(field ?? "", text(body.rule) ?? "", context)}`;
    case "INVALID_REQUEST":
      return `${fieldLabel(field)}: invalid value.`;
    case "UNKNOWN_BATTLE_TAG":
      return `No W3Champions player found for ${text(data.battleTag) ?? "this BattleTag"}. Check the spelling and capitalization.`;
    case "ROLE_EXISTS": {
      const battleTag = text(data.battleTag) ?? "This account";
      const role = ROLE_LABELS[text(data.role) ?? ""];
      return role === undefined
        ? `${battleTag} already has a role here. Remove it first to change it.`
        : `${battleTag} already has the role "${role}" here. Remove it first to change it.`;
    }
    case "EVENT_SUSPENDED": {
      const note = text(data.message);
      return note === undefined ? "This event is suspended." : `This event is suspended. Reason: ${note}`;
    }
    case "ALLOCATION_INACTIVE": {
      const startsAt = formatUtc(text(data.startsAt));
      return startsAt === "—"
        ? "Only an active allocation can be ended now. This allocation has already ended."
        : `Only an active allocation can be ended now. This allocation starts ${startsAt}.`;
    }
    case "TERMINATE_FAILED":
      return `The game couldn't be terminated: ${text(data.message) ?? "unknown error"}`;
    default:
      return CODE_TEXT[code];
  }
}

/**
 * English admin message for a failed commercial-events request (C-E4): by
 * `code`, else the body's `error`, else a ProblemDetails `title`, else the HTTP
 * status. website-backend passes matchmaking 4xx bodies through verbatim; its
 * own 401 comes from the permission filter and its own model-binding 400 is a
 * ProblemDetails `{title, errors}`.
 */
export function describeCommercialEventsError(e: unknown, context: ErrorContext = "other"): string {
  if (!(e instanceof HttpError)) return e instanceof Error ? e.message : String(e);
  const body = parseBody(e.responseBody);
  if (e.status === 401) {
    return text(body.error) === "AUTH_TOKEN_EXPIRED" ? "Your session has expired. Log in again." : "You don't have the CommercialLicense permission.";
  }
  const code = text(body.code);
  const known = code === undefined ? undefined : codeText(code, body, context);
  if (known !== undefined) return known;
  if (e.status === 403) return "The matchmaking service refused the request (admin secret). Contact a developer.";
  return text(body.error) ?? text(body.title) ?? `Request failed (HTTP ${e.status})`;
}
