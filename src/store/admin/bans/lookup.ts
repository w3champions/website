import { BanAdminService } from "@/services/admin/BanAdminService";
import { useOauthStore } from "@/store/oauth/store";
import { sameTag } from "./tags";
import type { AccountLookupResponse } from "./types";

export const LOOKUP_MIN_CHARS = 3;

export type PlayerEntry = { kind: "account"; accountKey: string; matchedBattleTag: string } | { kind: "noSingleMatch"; lookupText: string };

/** Trimmed; shorter than 3 gives `{ total: 0, results: [] }` without a request. */
export async function lookupAccounts(q: string): Promise<AccountLookupResponse> {
  const text = q.trim();
  if (text.length < LOOKUP_MIN_CHARS) return { total: 0, results: [] };
  return await BanAdminService.lookup(text, useOauthStore().token);
}

/** The one account whose matchedBattleTag is the same tag as `name`, else noSingleMatch with the trimmed name. */
export function playerEntryOf(name: string, response: AccountLookupResponse): PlayerEntry {
  const lookupText = name.trim();
  const matches = response.results.filter((result) => sameTag(result.matchedBattleTag, lookupText));
  const accounts = new Set(matches.map((match) => match.accountKey));
  return accounts.size === 1 ? { kind: "account", accountKey: matches[0].accountKey, matchedBattleTag: matches[0].matchedBattleTag } : { kind: "noSingleMatch", lookupText };
}

export async function resolvePlayerEntry(name: string): Promise<PlayerEntry> {
  return playerEntryOf(name, await lookupAccounts(name));
}
