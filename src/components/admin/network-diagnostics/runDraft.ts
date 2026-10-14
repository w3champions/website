import { type Audience, type CreateRunRequest, type CustomTarget, type FloNodeTarget, NETDIAG_METHODS, type NetDiagMethod } from "@/store/admin/networkDiagnostics/types";
import { DASH, formatDuration } from "./format";

/** C6 tag rule. Matched as written: never trimmed inside, never case-folded. The server's .NET `\s` also covers U+0085, which JS `\s` does not. */
export const BATTLE_TAG_PATTERN = /^[^#\s\u0085]{2,12}#\d{3,6}$/;
export const MAX_BATTLE_TAGS = 500;
/** The server reads the count as a 32-bit int; larger values fail as invalid JSON. */
export const MAX_SAMPLE_COUNT = 2147483647;
export const MAX_CUSTOM_TARGETS = 50;
export const WINDOW_SECONDS_MIN = 30;
export const WINDOW_SECONDS_MAX = 300;
export const DEFAULT_WINDOW_SECONDS = 60;
export const DEFAULT_TCP_PORT = 443;
/** Spec §8: expectedDurationSeconds = 15 s snapshot allowance + windowSeconds. */
export const SNAPSHOT_ALLOWANCE_SECONDS = 15;
/** Spec §4.1: fleet slots are spread over WindowStart + 30 min. */
export const FLEET_WINDOW_MINUTES = 30;
/** Spec §5.2: explicit-audience assignments stay deliverable for 14 days. */
export const USER_DELIVERY_DAYS = 14;
/** MTR round 1 doubles as the traceroute, so the trace methods are off by default. */
export const DEFAULT_METHODS: readonly NetDiagMethod[] = ["IcmpMtr", "TcpMtr", "TcpPing", "FloUdpPing"];

const MAX_PORT = 65535;
const SEPARATORS = /[\s,;]+/;
const IPV4_OCTET = /^(0|[1-9]\d{0,2})$/;
const PORT_DIGITS = /^\d{1,5}$/;
const MAX_OCTET = 255;

export type AudienceChoice = "single" | "users" | "sampleCount" | "samplePercent" | "all";

/** Form state of the New measurement page. Numbers are null while the field is empty or invalid. */
export interface RunDraft {
  audience: AudienceChoice;
  singleBattleTag: string;
  battleTags: string[];
  sampleCount: number | null;
  samplePercent: number | null;
  allFloNodes: boolean;
  floNodeIds: number[];
  coreServers: string[];
  baselines: string[];
  customTargets: CustomTarget[];
  includeDefaultGateway: boolean;
  methods: NetDiagMethod[];
  allowDuringGame: boolean;
  windowSeconds: number | null;
}

export function emptyRunDraft(): RunDraft {
  return {
    audience: "single",
    singleBattleTag: "",
    battleTags: [],
    sampleCount: null,
    samplePercent: null,
    allFloNodes: false,
    floNodeIds: [],
    coreServers: [],
    baselines: [],
    customTargets: [],
    includeDefaultGateway: true,
    methods: [...DEFAULT_METHODS],
    allowDuringGame: false,
    windowSeconds: DEFAULT_WINDOW_SECONDS,
  };
}

/** A v-combobox `update:modelValue` payload as plain strings. */
export function stringValues(values: unknown): string[] {
  return Array.isArray(values) ? values.filter((value): value is string => typeof value === "string") : [];
}

/** Splits pasted text on whitespace, commas and semicolons; neither BattleTags nor IP:port chips contain them. */
export function splitList(input: string): string[] {
  return input.split(SEPARATORS).filter((part) => part !== "");
}

/** Combobox values → tag list: pasted lists split, exact duplicates dropped, order kept, case kept. */
export function normalizeBattleTagList(values: readonly string[]): string[] {
  return [...new Set(values.flatMap(splitList))];
}

export function isBattleTag(value: string): boolean {
  return BATTLE_TAG_PATTERN.test(value);
}

export type CustomTargetParse = { ok: true; target: CustomTarget } | { ok: false; error: string };

/** "a.b.c.d" or "a.b.c.d:port"; IPv4 only (spec non-goal: IPv6). */
export function parseCustomTarget(input: string): CustomTargetParse {
  const text = input.trim();
  const colon = text.lastIndexOf(":");
  const ip = colon === -1 ? text : text.slice(0, colon);
  const portText = colon === -1 ? "" : text.slice(colon + 1);
  const octets = ip.split(".");
  if (octets.length !== 4 || !octets.every((octet) => IPV4_OCTET.test(octet) && Number(octet) <= MAX_OCTET)) {
    return { ok: false, error: `"${text}" is not an IPv4 address (IPv6 is not supported).` };
  }
  if (colon === -1) return { ok: true, target: { ip, tcpPort: DEFAULT_TCP_PORT } };
  const port = Number(portText);
  if (!PORT_DIGITS.test(portText) || port < 1 || port > MAX_PORT) {
    return { ok: false, error: `"${text}": the port must be 1–${MAX_PORT}.` };
  }
  return { ok: true, target: { ip, tcpPort: port } };
}

/** C4 target key of a custom endpoint. */
export function customTargetKey(target: CustomTarget): string {
  return `custom:${target.ip}:${target.tcpPort}`;
}

export function customTargetText(target: CustomTarget): string {
  return `${target.ip}:${target.tcpPort}`;
}

/** Combobox chips → targets, deduplicated by target key, plus one message per rejected chip. */
export function parseCustomTargets(values: readonly string[]): { targets: CustomTarget[]; errors: string[] } {
  const byKey = new Map<string, CustomTarget>();
  const errors: string[] = [];
  for (const value of values.flatMap(splitList)) {
    const parsed = parseCustomTarget(value);
    if (parsed.ok) byKey.set(customTargetKey(parsed.target), parsed.target);
    else errors.push(parsed.error);
  }
  return { targets: [...byKey.values()], errors };
}

/** A `type="number"` field value → finite number, or null for empty or junk input. */
export function numberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasAnyTarget(d: RunDraft): boolean {
  return d.allFloNodes || d.floNodeIds.length > 0 || d.coreServers.length > 0 || d.baselines.length > 0 || d.customTargets.length > 0 || d.includeDefaultGateway;
}

function isValidWindow(windowSeconds: number | null): windowSeconds is number {
  return windowSeconds !== null && Number.isInteger(windowSeconds) && windowSeconds >= WINDOW_SECONDS_MIN && windowSeconds <= WINDOW_SECONDS_MAX;
}

function audienceErrors(d: RunDraft): string[] {
  switch (d.audience) {
    case "single":
      return isBattleTag(d.singleBattleTag) ? [] : ["Pick a player."];
    case "users": {
      if (d.battleTags.length === 0) return ["Enter at least one BattleTag."];
      const errors: string[] = [];
      if (d.battleTags.length > MAX_BATTLE_TAGS) errors.push(`Enter at most ${MAX_BATTLE_TAGS} BattleTags (${d.battleTags.length} entered).`);
      const invalid = d.battleTags.filter((tag) => !isBattleTag(tag));
      if (invalid.length > 0) errors.push(`Not a BattleTag (Name#1234): ${invalid.join(", ")}`);
      return errors;
    }
    case "sampleCount":
      return d.sampleCount !== null && Number.isInteger(d.sampleCount) && d.sampleCount >= 1 && d.sampleCount <= MAX_SAMPLE_COUNT ? [] : [`Sample count: enter a whole number from 1 to ${MAX_SAMPLE_COUNT}.`];
    case "samplePercent":
      return d.samplePercent !== null && d.samplePercent > 0 && d.samplePercent <= 100 ? [] : ["Sample %: enter a number above 0 and at most 100."];
    case "all":
      return [];
  }
}

/** Every C6 validation rule the form can check before sending; unknown players are only known to the backend. */
export function validateRunDraft(d: RunDraft): string[] {
  const errors = audienceErrors(d);
  if (!hasAnyTarget(d)) errors.push("Select at least one target.");
  if (d.customTargets.length > MAX_CUSTOM_TARGETS) errors.push(`Add at most ${MAX_CUSTOM_TARGETS} custom targets (${d.customTargets.length} entered).`);
  if (d.methods.length === 0) errors.push("Select at least one method.");
  if (!isValidWindow(d.windowSeconds)) errors.push(`Window: enter whole seconds from ${WINDOW_SECONDS_MIN} to ${WINDOW_SECONDS_MAX}.`);
  return errors;
}

function audienceOf(d: RunDraft): Audience {
  switch (d.audience) {
    case "single":
      return { kind: "Users", battleTags: [d.singleBattleTag] };
    case "users":
      return { kind: "Users", battleTags: [...d.battleTags] };
    case "sampleCount":
      return { kind: "SampleCount", count: d.sampleCount ?? 0 };
    case "samplePercent":
      return { kind: "SamplePercent", percent: d.samplePercent ?? 0 };
    case "all":
      return { kind: "All" };
  }
}

export type BuildRunResult = { ok: true; request: CreateRunRequest } | { ok: false; errors: string[] };

export function buildCreateRunRequest(d: RunDraft): BuildRunResult {
  const errors = validateRunDraft(d);
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    request: {
      audience: audienceOf(d),
      targets: {
        floNodeIds: d.allFloNodes ? [] : [...new Set(d.floNodeIds)].sort((a, b) => a - b),
        allFloNodes: d.allFloNodes,
        coreServers: [...d.coreServers],
        baselines: [...d.baselines],
        customTargets: d.customTargets.map((target) => ({ ...target })),
        includeDefaultGateway: d.includeDefaultGateway,
      },
      methods: NETDIAG_METHODS.filter((method) => d.methods.includes(method)),
      allowDuringGame: d.allowDuringGame,
      windowSeconds: d.windowSeconds ?? DEFAULT_WINDOW_SECONDS,
    },
  };
}

export function expectedDurationSeconds(windowSeconds: number): number {
  return SNAPSHOT_ALLOWANCE_SECONDS + windowSeconds;
}

export function expectedDurationText(d: Pick<RunDraft, "audience" | "windowSeconds">): string {
  if (!isValidWindow(d.windowSeconds)) return "Enter a valid window to see the expected duration.";
  const each = formatDuration(expectedDurationSeconds(d.windowSeconds));
  if (d.audience === "single" || d.audience === "users") {
    return `About ${each} per player once their launcher is online and idle. Deliverable for ${USER_DELIVERY_DAYS} days.`;
  }
  return `Measurements start at random times over the next ${FLEET_WINDOW_MINUTES} min; each takes about ${each}.`;
}

export function requiresAllConfirmation(d: Pick<RunDraft, "audience">): boolean {
  return d.audience === "all";
}

export function nodeSelectItems(nodes: readonly FloNodeTarget[]): { title: string; value: number }[] {
  return nodes.map((node) => ({ title: `${[node.name, node.location].map((part) => part || DASH).join(" — ")}${node.isDisabled ? " (disabled)" : ""}`, value: node.id }));
}

export function endpointLabel(target: { label: string; ip: string; tcpPort: number }): string {
  return `${target.label} (${target.ip}:${target.tcpPort})`;
}
