import type { LocationQuery } from "vue-router";
import type { BanListQuery, BanStatus } from "./types";

/** The statuses a ban can have, in the order the status filters list them. */
export const BAN_STATUSES: readonly BanStatus[] = ["inEffect", "expired", "revoked"];
const SORTS = ["lastChange", "ends"] as const;
const AUTHOR_MAX = 200;
const WHOLE_NUMBER = /^\d+$/u;

export const BANS_PAGE_SIZE = 25;

export interface BanPageQuery {
  status: BanStatus | null;
  author: string | null;
  sort: "lastChange" | "ends" | null;
  dir: "asc" | "desc";
  page: number;
  account: string | null;
}

export const DEFAULT_PAGE_QUERY: BanPageQuery = { status: null, author: null, sort: null, dir: "desc", page: 1, account: null };

function single(value: LocationQuery[string] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function oneOf<T extends string>(allowed: readonly T[], value: string | null): T | null {
  return allowed.find((known) => known === value) ?? null;
}

function pageOf(value: string | null): number {
  if (value === null || !WHOLE_NUMBER.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

function authorOf(value: string | null): string | null {
  const author = value?.trim() ?? "";
  return author !== "" && author.length <= AUTHOR_MAX ? author : null;
}

/** Unknown or repeated values count as absent. */
export function pageQueryFromRoute(query: LocationQuery): BanPageQuery {
  const account = single(query.account);
  return {
    status: oneOf(BAN_STATUSES, single(query.status)),
    author: authorOf(single(query.author)),
    sort: oneOf(SORTS, single(query.sort)),
    dir: single(query.dir) === "asc" ? "asc" : "desc",
    page: pageOf(single(query.page)),
    account: account === null || account === "" ? null : account,
  };
}

/** Keys status, author, sort, dir, page, account, player; defaults give undefined; player is always undefined. */
export function pageQueryToRoute(query: BanPageQuery): Record<string, string | undefined> {
  return {
    status: query.status ?? undefined,
    author: query.author ?? undefined,
    sort: query.sort ?? undefined,
    dir: query.dir === DEFAULT_PAGE_QUERY.dir ? undefined : query.dir,
    page: query.page === DEFAULT_PAGE_QUERY.page ? undefined : String(query.page),
    account: query.account ?? undefined,
    player: undefined,
  };
}

/** `?player=<name>`: trimmed single non-empty string, else null. */
export function entryPlayerFromRoute(query: LocationQuery): string | null {
  const name = single(query.player)?.trim();
  return name === undefined || name === "" ? null : name;
}

/** sort null gives "accountDefault" with an account, else "lastChange"; machineOnly applies to the log only. */
export function listRequestOf(query: BanPageQuery, machineOnly: boolean): BanListQuery {
  return {
    ...(query.status !== null ? { status: query.status } : {}),
    ...(query.author !== null ? { author: query.author } : {}),
    ...(query.account !== null ? { account: query.account } : {}),
    // The machine filter is the log's; an account's view always shows all of its bans.
    ...(machineOnly && query.account === null ? { machineOnly: true } : {}),
    sort: query.sort ?? (query.account !== null ? "accountDefault" : "lastChange"),
    dir: query.dir,
    page: query.page,
    pageSize: BANS_PAGE_SIZE,
  };
}

/** Opening or leaving an account: DEFAULT_PAGE_QUERY with that account. */
export function withAccount(_query: BanPageQuery, account: string | null): BanPageQuery {
  return { ...DEFAULT_PAGE_QUERY, account };
}
