import { defineStore } from "pinia";
import { BanAdminService } from "@/services/admin/BanAdminService";
import { BanApiError } from "@/services/admin/banApiError";
import { loadLatest, requestSequence } from "@/store/admin/latest";
import { useOauthStore } from "@/store/oauth/store";
import { mayHaveBeenSaved } from "./errors";
import { type BanPageQuery, DEFAULT_PAGE_QUERY, listRequestOf } from "./listQuery";
import type { AccountView, BanView, CreateBanRequest, EditBanRequest } from "./types";

/** Sequences live at module level so `$reset()` cannot rewind them. */
const listLoads = requestSequence();
const accountLoads = requestSequence();
const authorLoads = requestSequence();
const rowAccountLoads = requestSequence();
/** One number per visit; `clear()` ends it, so a write finishing later changes nothing. */
const visits = requestSequence();

/** The account key the opened row's account line was last asked for (set while it loads, when `rowAccount` is still null). */
let rowAccountKey: string | null = null;

const HTTP_CONFLICT = 409;
/** The most bans in effect one account can show; "Edit that ban instead" looks through them. */
const IN_EFFECT_LOOKUP_SIZE = 100;

const token = (): string => useOauthStore().token;

/** The write ended in a refusal that says the page shows stale data (changed by someone else, ended or revoked). */
const isConflict = (e: unknown): boolean => e instanceof BanApiError && e.status === HTTP_CONFLICT;

export interface BansState {
  query: BanPageQuery;
  /** Never in the URL. */
  machineOnly: boolean;
  bans: BanView[];
  total: number;
  listLoading: boolean;
  listError: unknown;
  account: AccountView | null;
  accountLoading: boolean;
  accountError: unknown;
  authors: string[];
  authorsError: unknown;
  acting: boolean;
  actionError: unknown;
  /** The last failed write may have been applied. */
  maybeSaved: boolean;
  /** The opened row's account line. */
  rowAccount: AccountView | null;
  rowAccountLoading: boolean;
  rowAccountError: unknown;
}

function initialState(): BansState {
  return {
    query: { ...DEFAULT_PAGE_QUERY },
    machineOnly: false,
    bans: [],
    total: 0,
    listLoading: false,
    listError: null,
    account: null,
    accountLoading: false,
    accountError: null,
    authors: [],
    authorsError: null,
    acting: false,
    actionError: null,
    maybeSaved: false,
    rowAccount: null,
    rowAccountLoading: false,
    rowAccountError: null,
  };
}

type BansStore = ReturnType<typeof useBansStore>;

/**
 * One write at a time. A refusal leaves every row as it is; a conflict also reloads what the page shows, and a
 * failure that may have been applied does the same and says so.
 */
async function write(store: BansStore, send: () => Promise<BanView>, onSuccess: (view: BanView) => Promise<void>): Promise<BanView | null> {
  if (store.acting) return null;
  const visit = visits.current();
  store.acting = true;
  store.actionError = null;
  store.maybeSaved = false;
  try {
    const view = await send();
    if (visits.isLatest(visit)) await onSuccess(view);
    return view;
  } catch (e) {
    if (!visits.isLatest(visit)) return null;
    store.actionError = e;
    store.maybeSaved = mayHaveBeenSaved(e);
    if (store.maybeSaved || isConflict(e)) await reloadShown(store);
    return null;
  } finally {
    if (visits.isLatest(visit)) store.acting = false;
  }
}

/** Reads again what the page shows: the list, the account and the opened row's account line. */
async function reloadShown(store: BansStore): Promise<void> {
  await Promise.all([store.loadList(), store.loadAccount(), reloadRowAccount(store)]);
}

/** The opened row's account line is read again when one is shown or still loading (a load in flight predates the write). */
function reloadRowAccount(store: BansStore, accountKey?: string): Promise<boolean> {
  const key = store.rowAccount?.accountKey ?? rowAccountKey;
  return key !== null && (accountKey === undefined || accountKey === key) ? store.loadRowAccount(key) : Promise.resolve(true);
}

/** The written ban replaces its row where it stands; the account and the row's account line are read again. */
async function applyChanged(store: BansStore, view: BanView): Promise<void> {
  store.bans = store.bans.map((ban) => (ban.id === view.id ? view : ban));
  // A list load still in flight predates the write: a fresh one supersedes it.
  const refresh: Promise<boolean>[] = [store.loadAccount(), reloadRowAccount(store, view.accountKey)];
  if (store.listLoading) refresh.push(store.loadList());
  await Promise.all(refresh);
}

export const useBansStore = defineStore("bans", {
  state: initialState,
  actions: {
    /** Loads the list, and the account view when query.account is set (cleared when null). */
    async setQuery(query: BanPageQuery): Promise<boolean> {
      this.query = { ...query };
      const [listed, account] = await Promise.all([this.loadList(), this.loadAccount()]);
      return listed && account;
    },
    setMachineOnly(on: boolean): Promise<boolean> {
      this.machineOnly = on;
      return this.loadList();
    },
    loadList(): Promise<boolean> {
      const request = listRequestOf(this.query, this.machineOnly);
      return loadLatest(listLoads, {
        what: "bans",
        setLoading: (loading) => {
          this.listLoading = loading;
        },
        fetch: () => BanAdminService.list(request, token()),
        apply: (result) => {
          this.bans = result.bans;
          this.total = result.total;
          this.listError = null;
        },
        fail: (e) => {
          this.listError = e;
        },
      });
    },
    async loadAccount(): Promise<boolean> {
      const accountKey = this.query.account;
      if (accountKey === null) {
        accountLoads.invalidate();
        this.account = null;
        this.accountLoading = false;
        this.accountError = null;
        return true;
      }
      return await loadLatest(accountLoads, {
        what: "account bans",
        setLoading: (loading) => {
          this.accountLoading = loading;
        },
        fetch: () => BanAdminService.account(accountKey, token()),
        apply: (result) => {
          this.account = result;
          this.accountError = null;
        },
        fail: (e) => {
          this.accountError = e;
        },
      });
    },
    loadAuthors(): Promise<boolean> {
      return loadLatest(authorLoads, {
        what: "ban authors",
        setLoading: () => {},
        fetch: () => BanAdminService.authors(token()),
        apply: (result) => {
          this.authors = result;
          this.authorsError = null;
        },
        fail: (e) => {
          this.authorsError = e;
        },
      });
    },
    async create(request: CreateBanRequest): Promise<BanView | null> {
      return await write(this, () => BanAdminService.create(request, token()), () => reloadShown(this));
    },
    async edit(banId: string, request: EditBanRequest): Promise<BanView | null> {
      return await write(this, () => BanAdminService.edit(banId, request, token()), (view) => applyChanged(this, view));
    },
    async revoke(banId: string, note: string): Promise<BanView | null> {
      return await write(this, () => BanAdminService.revoke(banId, note, token()), (view) => applyChanged(this, view));
    },
    loadRowAccount(accountKey: string): Promise<boolean> {
      rowAccountKey = accountKey;
      if (this.rowAccount?.accountKey !== accountKey) this.rowAccount = null;
      return loadLatest(rowAccountLoads, {
        what: "account of the opened ban",
        setLoading: (loading) => {
          this.rowAccountLoading = loading;
        },
        fetch: () => BanAdminService.account(accountKey, token()),
        apply: (result) => {
          this.rowAccount = result;
          this.rowAccountError = null;
        },
        fail: (e) => {
          this.rowAccountError = e;
        },
      });
    },
    /** The account's ban with that id among its bans in effect; null when it ended or was revoked meanwhile. A failed request rejects. */
    async banInEffect(accountKey: string, banId: string): Promise<BanView | null> {
      const answer = await BanAdminService.list({ account: accountKey, status: "inEffect", sort: "accountDefault", page: 1, pageSize: IN_EFFECT_LOOKUP_SIZE }, token());
      return answer.bans.find((ban) => ban.id === banId) ?? null;
    },
    clearActionError(): void {
      this.actionError = null;
      this.maybeSaved = false;
    },
    clear(): void {
      for (const sequence of [listLoads, accountLoads, authorLoads, rowAccountLoads, visits]) sequence.invalidate();
      rowAccountKey = null;
      this.$reset();
    },
  },
});
