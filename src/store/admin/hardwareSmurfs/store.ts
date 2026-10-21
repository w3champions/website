import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { loadLatest, requestSequence } from "@/store/admin/latest";
import { HardwareSmurfApiError } from "@/services/admin/HardwareSmurfService";
import type { AuditEntry, HardwareItemDetail, HardwareLink, HardwareProfileItemView, OverrideResult } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { needsReason, type OverrideAction } from "./actions";
import { appendAuditPage } from "./audit";
import { hardwareSmurfService } from "./service";

export const AUDIT_PAGE_SIZE = 50;

export type ActionTarget = { kind: "pair"; other: string } | { kind: "item"; hash8: string };

export interface ActionRequest {
  action: OverrideAction;
  target: ActionTarget;
  /** Required by the actions that set an override; ignored by revokes. */
  reason: string;
}

export interface ActionOutcome {
  action: OverrideAction;
  result: OverrideResult;
}

interface HardwareSmurfsState {
  battleTag: string;
  links: HardwareLink[];
  linksLoading: boolean;
  linksError: unknown;
  items: HardwareProfileItemView[];
  itemsLoading: boolean;
  itemsError: unknown;
  /** The account has no hardware profile (items answered 404). */
  noProfile: boolean;
  /** Newest first. */
  audit: AuditEntry[];
  /** The `before` of the next page; null once the last page is shown. */
  auditNext: string | null;
  auditLoading: boolean;
  auditError: unknown;
  itemDetail: HardwareItemDetail | null;
  itemDetailLoading: boolean;
  itemDetailError: unknown;
  acting: boolean;
  actionError: unknown;
  lastResult: ActionOutcome | null;
}

function token(): string {
  return useOauthStore().token;
}

// Only the newest request of each kind writes its result; `clear()` supersedes them all.
const linkLoads = requestSequence();
const itemLoads = requestSequence();
const auditLoads = requestSequence();
const detailLoads = requestSequence();

async function send(battleTag: string, request: ActionRequest, reason: string): Promise<OverrideResult> {
  const service = hardwareSmurfService();
  const { target } = request;
  if (target.kind === "pair") {
    switch (request.action) {
      case "smurf":
        return await service.setSmurf(token(), battleTag, target.other, reason);
      case "revoke-smurf":
        return await service.revokeSmurf(token(), battleTag, target.other);
      case "not-smurf":
        return await service.setNotSmurf(token(), battleTag, target.other, reason);
      case "revoke-not-smurf":
        return await service.revokeNotSmurf(token(), battleTag, target.other);
    }
  } else {
    switch (request.action) {
      case "trust":
        return await service.trustItem(token(), battleTag, target.hash8, reason);
      case "revoke-trust":
        return await service.revokeTrust(token(), battleTag, target.hash8);
      case "ignore":
        return await service.ignoreItem(token(), battleTag, target.hash8, reason);
      case "revoke-ignore":
        return await service.revokeIgnore(token(), battleTag, target.hash8);
    }
  }
  throw new Error(`${request.action} does not apply to a ${target.kind}`);
}

export const useHardwareSmurfsStore = defineStore("hardwareSmurfs", {
  state: (): HardwareSmurfsState => ({
    battleTag: "",
    links: [],
    linksLoading: false,
    linksError: null,
    items: [],
    itemsLoading: false,
    itemsError: null,
    noProfile: false,
    audit: [],
    auditNext: null,
    auditLoading: false,
    auditError: null,
    itemDetail: null,
    itemDetailLoading: false,
    itemDetailError: null,
    acting: false,
    actionError: null,
    lastResult: null,
  }),

  getters: {
    liveLinks: (state): HardwareLink[] => state.links.filter((l) => !l.invalidatedAt),
    tombstones: (state): HardwareLink[] => state.links.filter((l) => !!l.invalidatedAt),
  },

  actions: {
    /** Shows another account: drops the previous one's data and loads everything. */
    async open(battleTag: string): Promise<void> {
      this.clear();
      this.battleTag = battleTag;
      await this.refresh();
    },

    async refresh(): Promise<void> {
      await Promise.all([this.loadLinks(), this.loadItems(), this.loadAudit()]);
    },

    clear(): void {
      linkLoads.invalidate();
      itemLoads.invalidate();
      auditLoads.invalidate();
      detailLoads.invalidate();
      this.$reset();
    },

    async loadLinks(): Promise<boolean> {
      this.linksError = null;
      const battleTag = this.battleTag;
      return await loadLatest(linkLoads, {
        what: "hardware links",
        setLoading: (loading) => (this.linksLoading = loading),
        fetch: () => hardwareSmurfService().getLinks(token(), battleTag),
        apply: (response) => (this.links = response.raw ?? []),
        fail: (e) => (this.linksError = e),
      });
    },

    async loadItems(): Promise<boolean> {
      this.itemsError = null;
      const battleTag = this.battleTag;
      return await loadLatest(itemLoads, {
        what: "hardware items",
        setLoading: (loading) => (this.itemsLoading = loading),
        fetch: () => hardwareSmurfService().getItems(token(), battleTag),
        apply: (response) => {
          this.items = response.items ?? [];
          this.noProfile = false;
        },
        fail: (e) => {
          this.items = [];
          if (e instanceof HardwareSmurfApiError && e.status === 404) this.noProfile = true;
          else this.itemsError = e;
        },
      });
    },

    /** The first page. */
    async loadAudit(): Promise<boolean> {
      this.auditError = null;
      const battleTag = this.battleTag;
      return await loadLatest(auditLoads, {
        what: "the override history",
        setLoading: (loading) => (this.auditLoading = loading),
        fetch: () => hardwareSmurfService().getAudit(token(), { battleTag, limit: AUDIT_PAGE_SIZE }),
        apply: (page) => {
          const shown = appendAuditPage(null, page);
          this.audit = shown.entries;
          this.auditNext = shown.next;
        },
        fail: (e) => (this.auditError = e),
      });
    },

    /** The next page; a no-op after the last one and while a page is loading. */
    async loadMoreAudit(): Promise<boolean> {
      const before = this.auditNext;
      if (before === null || this.auditLoading) return true;
      this.auditError = null;
      const battleTag = this.battleTag;
      return await loadLatest(auditLoads, {
        what: "the override history",
        setLoading: (loading) => (this.auditLoading = loading),
        fetch: () => hardwareSmurfService().getAudit(token(), { battleTag, before, limit: AUDIT_PAGE_SIZE }),
        apply: (page) => {
          const shown = appendAuditPage({ entries: this.audit, next: this.auditNext }, page);
          this.audit = shown.entries;
          this.auditNext = shown.next;
        },
        fail: (e) => (this.auditError = e),
      });
    },

    /** One item with its holder count, shown before a trust or ignore. */
    async loadItemDetail(hash8: string): Promise<boolean> {
      this.itemDetail = null;
      this.itemDetailError = null;
      const battleTag = this.battleTag;
      return await loadLatest(detailLoads, {
        what: "the hardware item",
        setLoading: (loading) => (this.itemDetailLoading = loading),
        fetch: () => hardwareSmurfService().getItem(token(), battleTag, hash8),
        apply: (detail) => (this.itemDetail = detail),
        fail: (e) => (this.itemDetailError = e),
      });
    },

    clearItemDetail(): void {
      detailLoads.invalidate();
      this.itemDetail = null;
      this.itemDetailError = null;
      this.itemDetailLoading = false;
    },

    /**
     * Sends one override. On success the server's answer is kept for the page and everything is
     * loaded again (the links change once the queued re-check ran). Resolves to whether it was applied.
     */
    async runAction(request: ActionRequest): Promise<boolean> {
      const reason = request.reason.trim();
      if (this.acting || (needsReason(request.action) && reason === "")) return false;
      const battleTag = this.battleTag;
      this.acting = true;
      this.actionError = null;
      try {
        const result = await send(battleTag, request, reason);
        if (this.battleTag !== battleTag) return true;
        this.lastResult = { action: request.action, result };
      } catch (e) {
        console.error(`Hardware override ${request.action} failed:`, e);
        if (this.battleTag === battleTag) this.actionError = e;
        return false;
      } finally {
        this.acting = false;
      }
      await this.refresh();
      return true;
    },

    dismissResult(): void {
      this.lastResult = null;
    },
  },
});
