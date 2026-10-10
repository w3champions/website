import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { allocationCreatedText, describeCommercialEventsError, MAYBE_SAVED_TEXT } from "./errors";
import { keyedRequestSequence, loadLatest, requestSequence } from "./latest";
import { commercialEventsService } from "./service";
import { emptyEventFilters } from "./types";
import type { AdminEvent, Allocation, AllocationCreateRequest, AllocationUpdateRequest, PeriodUsage } from "./types";
import { resetKeepingWrite, runAdminWrite } from "./write";

/** Expanded-row data of one allocation. */
export interface AllocationRowDetails {
  periods: PeriodUsage[];
  events: AdminEvent[];
  loading: boolean;
  error: string;
}

interface AllocationsState {
  allocations: Allocation[];
  loading: boolean;
  saving: boolean;
  /** Last failed write; shown in the dialog or the page banner. */
  error: string;
  /** Last failed load; kept apart so closing a dialog cannot hide it. */
  loadError: string;
  details: Record<string, AllocationRowDetails>;
}

function token(): string {
  return useOauthStore().token;
}

// Only the newest list request may write the list.
const loads = requestSequence();
// Per allocation id: only the newest details request may write, and none after a delete.
const detailLoads = keyedRequestSequence();
// One number per page visit: a write that settles after its page was left drops its error and reload.
const visits = requestSequence();

export const useCommercialEventAllocationsStore = defineStore("commercialEventAllocations", {
  state: (): AllocationsState => ({
    allocations: [],
    loading: false,
    saving: false,
    error: "",
    loadError: "",
    details: {},
  }),

  getters: {
    byId: (state) => (allocationId: string): Allocation | undefined => state.allocations.find((a) => a.id === allocationId),
  },

  actions: {
    /** Server order: startsAt descending. Resolves to whether the request succeeded. */
    async load(): Promise<boolean> {
      this.loadError = "";
      return await loadLatest(loads, {
        what: "allocations",
        setLoading: (loading) => (this.loading = loading),
        fetch: () => commercialEventsService().getAllocations(token()),
        apply: (allocations) => {
          this.allocations = allocations;
          // Details of allocations no longer listed (deleted elsewhere): drop them and their pending loads.
          const listed = new Set(allocations.map((a) => a.id));
          for (const id of Object.keys(this.details).filter((id) => !listed.has(id))) {
            detailLoads.invalidate(id);
            delete this.details[id];
          }
        },
        fail: (e) => {
          this.loadError = describeCommercialEventsError(e);
          this.allocations = [];
        },
      });
    },

    /** Drops the list, every row's details and every pending load; a write in flight stays marked. */
    clear(): void {
      loads.invalidate();
      detailLoads.clear();
      visits.invalidate();
      resetKeepingWrite(this);
    },

    /** The page was left: writes still in flight no longer report into it, and its last write error is not shown again. */
    endVisit(): void {
      visits.invalidate();
      this.error = "";
    },

    /** Reloads the list and the expanded rows' details, after a write whose outcome is unknown; resolves to whether the list loaded. */
    async refresh(): Promise<boolean> {
      const [listed] = await Promise.all([this.load(), ...Object.keys(this.details).map((id) => this.loadDetails(id))]);
      return listed;
    },

    replace(allocation: Allocation): void {
      this.allocations = this.allocations.map((a) => (a.id === allocation.id ? allocation : a));
    },

    /** After a write applied locally: a list load already in flight may answer with the old state, so supersede it with a fresh one. */
    supersedePendingLoad(): void {
      if (this.loading) void this.load();
    },

    async create(request: AllocationCreateRequest): Promise<Allocation | null> {
      const known = new Set(this.allocations.map((a) => a.id));
      const created = await runAdminWrite(this, "allocation", () => commercialEventsService().createAllocation(token(), request), () => this.refresh(), visits);
      if (created) {
        // A reload that ran meanwhile may already list it.
        this.allocations = [created, ...this.allocations.filter((a) => a.id !== created.id)];
        this.supersedePendingLoad();
      } else if (this.error === MAYBE_SAVED_TEXT) {
        // The table may be sorted or paged so that the new row is out of sight: when the reload has it, say so and return
        // it, so the dialog edits it instead of offering a second create. A missing row proves nothing (the create may
        // still be running), so then the general text stays.
        const name = request.name.trim();
        const found = this.allocations.find((a) => a.name === name && !known.has(a.id));
        if (found) {
          this.error = allocationCreatedText(name);
          return found;
        }
      }
      return created;
    },

    async update(allocationId: string, request: AllocationUpdateRequest): Promise<Allocation | null> {
      const updated = await runAdminWrite(this, "allocation", () => commercialEventsService().updateAllocation(token(), allocationId, request), () => this.refresh(), visits);
      if (updated) {
        this.replace(updated);
        this.supersedePendingLoad();
        // Period sizes follow gamesPerPeriod.
        if (this.details[allocationId]) void this.loadDetails(allocationId);
      }
      return updated;
    },

    async addMember(allocationId: string, battleTag: string): Promise<Allocation | null> {
      const updated = await runAdminWrite(this, "allocation", () => commercialEventsService().addAllocationMember(token(), allocationId, battleTag), () => this.refresh(), visits);
      if (updated) {
        this.replace(updated);
        this.supersedePendingLoad();
      }
      return updated;
    },

    async removeMember(allocationId: string, battleTag: string): Promise<Allocation | null> {
      const updated = await runAdminWrite(this, "allocation", () => commercialEventsService().removeAllocationMember(token(), allocationId, battleTag), () => this.refresh(), visits);
      if (updated) {
        this.replace(updated);
        this.supersedePendingLoad();
      }
      return updated;
    },

    /** End now: endsAt = now on the server. */
    async end(allocationId: string): Promise<Allocation | null> {
      const ended = await runAdminWrite(this, "allocation", () => commercialEventsService().endAllocation(token(), allocationId), () => this.refresh(), visits);
      if (ended) {
        this.replace(ended);
        this.supersedePendingLoad();
        if (this.details[allocationId]) void this.loadDetails(allocationId);
      }
      return ended;
    },

    async remove(allocationId: string): Promise<boolean> {
      const removed = await runAdminWrite(
        this,
        "allocation",
        async () => {
          await commercialEventsService().deleteAllocation(token(), allocationId);
          return true;
        },
        () => this.load(),
        visits,
      );
      if (removed) {
        this.allocations = this.allocations.filter((a) => a.id !== allocationId);
        // An older list response would bring the deleted row back.
        this.supersedePendingLoad();
        detailLoads.invalidate(allocationId);
        delete this.details[allocationId];
      }
      return removed ?? false;
    },

    /** Periods and events of one allocation for its expanded row. */
    async loadDetails(allocationId: string): Promise<boolean> {
      const row = (): AllocationRowDetails => this.details[allocationId] ?? { periods: [], events: [], loading: false, error: "" };
      return await loadLatest(detailLoads.forKey(allocationId), {
        what: "allocation details",
        setLoading: (loading) => (this.details[allocationId] = { ...row(), loading, ...(loading ? { error: "" } : {}) }),
        fetch: () =>
          Promise.all([
            commercialEventsService().getAllocationPeriods(token(), allocationId),
            commercialEventsService().getEvents(token(), { ...emptyEventFilters(), allocationId }),
          ]),
        apply: ([periods, events]) => (this.details[allocationId] = { ...row(), periods, events }),
        fail: (e) => (this.details[allocationId] = { ...row(), periods: [], events: [], error: describeCommercialEventsError(e) }),
      });
    },
  },
});
