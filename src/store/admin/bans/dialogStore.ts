import { defineStore } from "pinia";
import { BanAdminService } from "@/services/admin/BanAdminService";
import { keyedRequestSequence, loadLatest, requestSequence } from "@/store/admin/latest";
import { useOauthStore } from "@/store/oauth/store";
import type { AccountView, MachineIdAccountsResponse, MachineIdRow, MachineImpactResponse } from "./types";

export interface BanDialogState {
  accountKey: string | null;
  /** account.inEffect.bans feeds overlap and what remains. */
  account: AccountView | null;
  contextLoading: boolean;
  contextError: unknown;
  machineRows: MachineIdRow[];
  machineRowsLoading: boolean;
  machineRowsError: unknown;
  /** The impact of the selection in `impactFor`; null while that one loads or after it failed. */
  impact: MachineImpactResponse | null;
  /** The selection (see {@link selectionKey}) the impact, its loading and its error belong to; null before the first. */
  impactFor: string | null;
  impactLoading: boolean;
  impactError: unknown;
  otherAccounts: Record<string, MachineIdAccountsResponse>;
  otherAccountsLoading: Record<string, boolean>;
  otherAccountsError: Record<string, unknown>;
}

/** Module-level sequences, so `$reset()` cannot rewind them. */
const contextLoads = requestSequence();
const machineLoads = requestSequence();
const impactLoads = requestSequence();
const otherLoads = keyedRequestSequence();

const NO_IMPACT = { otherAccounts: 0, capped: false, counted: 0 } as const;

const token = (): string => useOauthStore().token;

/** One key per set of machine IDs, whatever their order. */
const selectionKey = (machineIds: readonly string[]): string => [...machineIds].sort().join(" ");

function initialState(): BanDialogState {
  return {
    accountKey: null,
    account: null,
    contextLoading: false,
    contextError: null,
    machineRows: [],
    machineRowsLoading: false,
    machineRowsError: null,
    impact: null,
    impactFor: null,
    impactLoading: false,
    impactError: null,
    otherAccounts: {},
    otherAccountsLoading: {},
    otherAccountsError: {},
  };
}

type BanDialogStore = ReturnType<typeof useBanDialogStore>;

function loadContext(store: BanDialogStore, accountKey: string): Promise<boolean> {
  return loadLatest(contextLoads, {
    what: "account bans in effect",
    setLoading: (loading) => {
      store.contextLoading = loading;
    },
    fetch: () => BanAdminService.account(accountKey, token()),
    apply: (result) => {
      store.account = result;
      store.contextError = null;
    },
    fail: (e) => {
      store.contextError = e;
    },
  });
}

function loadMachineRows(store: BanDialogStore, accountKey: string): Promise<boolean> {
  return loadLatest(machineLoads, {
    what: "machine IDs",
    setLoading: (loading) => {
      store.machineRowsLoading = loading;
    },
    fetch: () => BanAdminService.machineIds(accountKey, token()),
    apply: (result) => {
      store.machineRows = result;
      store.machineRowsError = null;
    },
    fail: (e) => {
      store.machineRowsError = e;
    },
  });
}

export const useBanDialogStore = defineStore("banDialog", {
  state: initialState,
  getters: {
    /** The impact of exactly these IDs has arrived: nothing older, pending or failed. */
    impactReadyFor: (state) => (machineIds: readonly string[]): boolean => state.impactFor === selectionKey(machineIds) && state.impact !== null && !state.impactLoading && state.impactError === null,
  },
  actions: {
    /** The account view; with machine access also the machine IDs (in parallel). The result is the account view's outcome. */
    async open(accountKey: string, options: { machineAccess: boolean }): Promise<boolean> {
      this.clear();
      this.accountKey = accountKey;
      const [account] = await Promise.all([loadContext(this, accountKey), options.machineAccess ? loadMachineRows(this, accountKey) : Promise.resolve(true)]);
      return account;
    },
    /**
     * The impact of a new selection; the previous selection's impact is dropped at once, and only the newest request writes.
     * [] gives impact { otherAccounts: 0, capped: false, counted: 0 } without a request.
     */
    async loadImpact(machineIds: string[]): Promise<boolean> {
      const accountKey = this.accountKey;
      this.impactFor = selectionKey(machineIds);
      this.impact = null;
      this.impactError = null;
      if (machineIds.length === 0) {
        impactLoads.invalidate();
        this.impact = { ...NO_IMPACT };
        this.impactLoading = false;
        this.impactError = null;
        return true;
      }
      if (accountKey === null) {
        impactLoads.invalidate(); // open() comes first: without an account there is nothing to ask about
        this.impactLoading = false;
        return false;
      }
      return await loadLatest(impactLoads, {
        what: "machine ban impact",
        setLoading: (loading) => {
          this.impactLoading = loading;
        },
        fetch: () => BanAdminService.machineImpact(accountKey, machineIds, token()),
        apply: (result) => {
          this.impact = result;
          this.impactError = null;
        },
        fail: (e) => {
          this.impactError = e;
        },
      });
    },
    /** excludeAccount = accountKey. */
    async loadOtherAccounts(machineId: string): Promise<boolean> {
      const accountKey = this.accountKey;
      if (accountKey === null) return false; // open() comes first
      return await loadLatest(otherLoads.forKey(machineId), {
        what: "accounts of a machine ID",
        setLoading: (loading) => {
          this.otherAccountsLoading = { ...this.otherAccountsLoading, [machineId]: loading };
        },
        fetch: () => BanAdminService.machineIdAccounts(machineId, accountKey, token()),
        apply: (result) => {
          this.otherAccounts = { ...this.otherAccounts, [machineId]: result };
          this.otherAccountsError = { ...this.otherAccountsError, [machineId]: null };
        },
        fail: (e) => {
          this.otherAccountsError = { ...this.otherAccountsError, [machineId]: e };
        },
      });
    },
    clear(): void {
      for (const sequence of [contextLoads, machineLoads, impactLoads]) sequence.invalidate();
      otherLoads.clear();
      this.$reset();
    },
  },
});
