import type { RoleHints } from "./types";

function eventIds(events: Array<{ eventId: string }>): string {
  return events.map((event) => event.eventId).join(", ");
}

/** Spec §10.3 role hints, verbatim: "Organizer in: <allocation names>", "Delegate in: <event ids>", "Host in: <event ids>". */
export function roleHintLines(hints: RoleHints | undefined): string[] {
  if (!hints) return [];
  const organizerOf = hints.organizerOf ?? [];
  const delegateOf = hints.delegateOf ?? [];
  const hostOf = hints.hostOf ?? [];
  const lines: string[] = [];
  if (organizerOf.length > 0) lines.push(`Organizer in: ${organizerOf.map((allocation) => allocation.allocationName).join(", ")}`);
  if (delegateOf.length > 0) lines.push(`Delegate in: ${eventIds(delegateOf)}`);
  if (hostOf.length > 0) lines.push(`Host in: ${eventIds(hostOf)}`);
  return lines;
}

/** Lookup by exact battle tag (the roles endpoint answers an array so serializers cannot re-case keys). */
export function roleHintsByBattleTag(list: RoleHints[]): Record<string, RoleHints> {
  return Object.fromEntries(list.map((hints) => [hints.battleTag, hints]));
}
