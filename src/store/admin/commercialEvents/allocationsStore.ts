import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { describeCommercialEventsError } from "./errors";
import { keyedRequestSequence, requestSequence } from "./latest";
import { commercialEventsService } from "./service";
import { emptyEventFilters } from "./types";
import type { AdminEvent, Allocation, AllocationCreateRequest, AllocationUpdateRequest, PeriodUsage } from "./types";
import { runAdminWrite } from "./write";

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
    /** Server order: startsAt descending. */
    async load(): Promise<void> {
      const request = loads.next();
      this.loading = true;
      this.loadError = "";
      try {
        const allocations = await commercialEventsService().getAllocations(token());
        if (loads.isLatest(request)) this.allocations = allocations;
      } catch (e) {
        console.error("Failed to load allocations:", e);
        if (loads.isLatest(request)) {
          this.loadError = describeCommercialEventsError(e);
          this.allocations = [];
        }
      } finally {
        if (loads.isLatest(request)) this.loading = false;
      }
    },

    /** Drops the list, every row's details and every pending load. */
    clear(): void {
      loads.invalidate();
      detailLoads.clear();
      this.$reset();
    },

    replace(allocation: Allocation): void {
      this.allocations = this.allocations.map((a) => (a.id === allocation.id ? allocation : a));
    },

    async create(request: AllocationCreateRequest): Promise<Allocation | null> {
      const created = await runAdminWrite(this, "allocation", () => commercialEventsService().createAllocation(token(), request));
      if (created) this.allocations = [created, ...this.allocations];
      return created;
    },

    async update(allocationId: string, request: AllocationUpdateRequest): Promise<Allocation | null> {
      const updated = await runAdminWrite(this, "allocation", () => commercialEventsService().updateAllocation(token(), allocationId, request));
      if (updated) {
        this.replace(updated);
        // Period sizes follow gamesPerPeriod.
        if (this.details[allocationId]) void this.loadDetails(allocationId);
      }
      return updated;
    },

    async addMember(allocationId: string, battleTag: string): Promise<Allocation | null> {
      const updated = await runAdminWrite(this, "allocation", () => commercialEventsService().addAllocationMember(token(), allocationId, battleTag));
      if (updated) this.replace(updated);
      return updated;
    },

    async removeMember(allocationId: string, battleTag: string): Promise<Allocation | null> {
      const updated = await runAdminWrite(this, "allocation", () => commercialEventsService().removeAllocationMember(token(), allocationId, battleTag));
      if (updated) this.replace(updated);
      return updated;
    },

    /** End now: endsAt = now on the server. */
    async end(allocationId: string): Promise<Allocation | null> {
      const ended = await runAdminWrite(this, "allocation", () => commercialEventsService().endAllocation(token(), allocationId));
      if (ended) {
        this.replace(ended);
        if (this.details[allocationId]) void this.loadDetails(allocationId);
      }
      return ended;
    },

    async remove(allocationId: string): Promise<boolean> {
      const removed = await runAdminWrite(this, "allocation", async () => {
        await commercialEventsService().deleteAllocation(token(), allocationId);
        return true;
      });
      if (removed) {
        this.allocations = this.allocations.filter((a) => a.id !== allocationId);
        detailLoads.invalidate(allocationId);
        delete this.details[allocationId];
      }
      return removed ?? false;
    },

    /** Periods and events of one allocation for its expanded row. */
    async loadDetails(allocationId: string): Promise<void> {
      const request = detailLoads.next(allocationId);
      const previous = this.details[allocationId];
      this.details[allocationId] = { periods: previous?.periods ?? [], events: previous?.events ?? [], loading: true, error: "" };
      try {
        const [periods, events] = await Promise.all([
          commercialEventsService().getAllocationPeriods(token(), allocationId),
          commercialEventsService().getEvents(token(), { ...emptyEventFilters(), allocationId }),
        ]);
        if (detailLoads.isLatest(allocationId, request)) this.details[allocationId] = { periods, events, loading: false, error: "" };
      } catch (e) {
        console.error("Failed to load allocation details:", e);
        if (detailLoads.isLatest(allocationId, request)) {
          this.details[allocationId] = { periods: [], events: [], loading: false, error: describeCommercialEventsError(e) };
        }
      }
    },
  },
});
