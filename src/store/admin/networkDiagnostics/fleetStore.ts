import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { loadLatest, requestSequence } from "@/store/admin/latest";
import { describeNetDiagError } from "./errors";
import { fleetAggregateKey, fleetFilters, type FleetGroupBy, type FleetSelection, fleetSelectionKey } from "./fleetSelection";
import { networkDiagnosticsService } from "./service";
import type { AggregateResponseDto, ObservationDto } from "./types";

/** Dots the map draws at most; an "All" run can exceed it and then shows a notice. */
export const MAX_MAP_OBSERVATIONS = 20_000;

// Module level so `$reset()` cannot rewind them (see store/admin/latest.ts).
const aggregateSequence = requestSequence();
const observationsSequence = requestSequence();

interface NetDiagFleetState {
  /** The selection the held aggregate belongs to; views compare it with theirs before showing it. */
  aggregateKey: string;
  aggregate: AggregateResponseDto | null;
  /** True when the server read only its newest observations for the held aggregate. */
  aggregateTruncated: boolean;
  aggregateLoading: boolean;
  aggregateError: string;
  /** The selection the held observations belong to. */
  observationsKey: string;
  observations: ObservationDto[];
  /** True when the cap was hit, the server paged out early or cut its scan short: only the first observations are held. */
  observationsTruncated: boolean;
  observationsLoading: boolean;
  observationsError: string;
}

export const useNetDiagFleetStore = defineStore("netDiagFleet", {
  state: (): NetDiagFleetState => ({
    aggregateKey: "",
    aggregate: null,
    aggregateTruncated: false,
    aggregateLoading: false,
    aggregateError: "",
    observationsKey: "",
    observations: [],
    observationsTruncated: false,
    observationsLoading: false,
    observationsError: "",
  }),

  actions: {
    /** Drops everything held and supersedes loads in flight, so a later visit starts empty. */
    clear(): void {
      aggregateSequence.invalidate();
      observationsSequence.invalidate();
      this.$reset();
    },

    async loadAggregate(selection: FleetSelection, groupBy: FleetGroupBy): Promise<boolean> {
      // A refresh of the same view keeps the table; another view must not show the old one.
      const key = fleetAggregateKey(selection, groupBy);
      if (this.aggregateKey !== key) {
        this.aggregateKey = key;
        this.aggregate = null;
        this.aggregateTruncated = false;
        this.aggregateError = "";
      }
      const token = useOauthStore().token;
      return await loadLatest(aggregateSequence, {
        what: "network diagnostic aggregate",
        setLoading: (loading) => {
          this.aggregateLoading = loading;
        },
        fetch: () => networkDiagnosticsService().getAggregate(token, [groupBy], fleetFilters(selection)),
        apply: (result) => {
          this.aggregate = result.data;
          this.aggregateTruncated = result.truncated;
          this.aggregateError = "";
        },
        fail: (e) => {
          this.aggregateError = describeNetDiagError(e);
        },
      });
    },

    async loadObservations(selection: FleetSelection): Promise<boolean> {
      const key = fleetSelectionKey(selection);
      if (this.observationsKey !== key) {
        this.observationsKey = key;
        this.observations = [];
        this.observationsTruncated = false;
        this.observationsError = "";
      }
      const token = useOauthStore().token;
      return await loadLatest(observationsSequence, {
        what: "network diagnostic observations",
        setLoading: (loading) => {
          this.observationsLoading = loading;
        },
        fetch: () => networkDiagnosticsService().getObservationsUpTo(token, fleetFilters(selection), MAX_MAP_OBSERVATIONS),
        apply: (result) => {
          this.observations = result.items;
          this.observationsTruncated = result.truncated;
          this.observationsError = "";
        },
        fail: (e) => {
          this.observationsError = describeNetDiagError(e);
        },
      });
    },
  },
});
