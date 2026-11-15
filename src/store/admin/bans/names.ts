import { sameTag } from "./tags";
import type { AccountName } from "./types";

export const NAMES_INLINE = 4;
export const NAMES_FILTER_ABOVE = 20;

/** A missing or unparsable date sorts last. */
const timeOf = (name: AccountName): number => {
  const time = name.lastBannedAt === null ? Number.NaN : new Date(name.lastBannedAt).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
};

/** Current name, then banned names newest ban first, then the rest in server order; a matched name moves into the inline ones. */
export function orderedNames(names: readonly AccountName[], matchedTag: string | null): AccountName[] {
  const current = names.filter((name) => name.current);
  const banned = names.filter((name) => !name.current && name.banCount > 0).sort((a, b) => timeOf(b) - timeOf(a)); // stable: ties keep server order
  const rest = names.filter((name) => !name.current && name.banCount <= 0);
  const ordered = [...current, ...banned, ...rest];
  if (matchedTag === null) return ordered;
  const at = ordered.findIndex((name) => sameTag(name.battleTag, matchedTag));
  if (at < NAMES_INLINE) return ordered;
  const [matched] = ordered.splice(at, 1);
  ordered.splice(1, 0, matched);
  return ordered;
}

export function filterNames(names: readonly AccountName[], q: string): AccountName[] {
  const needle = q.trim().toLowerCase();
  return needle === "" ? [...names] : names.filter((name) => name.battleTag.toLowerCase().includes(needle));
}
