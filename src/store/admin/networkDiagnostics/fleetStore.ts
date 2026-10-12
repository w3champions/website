import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { loadLatest, requestSequence } from "@/store/admin/latest";
import { describeNetDiagError } from "./errors";
import { fleetFilters, type FleetGroupBy, type FleetSelection, fleetSelectionKey } from "./fleetSelection";
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
  aggregateLoading: boolean;
  aggregateError: string;
  /** The selection the held observations belong to. */
  observationsKey: string;
  observations: ObservationDto[];
  /** True when the cap was hit or the server paged out early: only the first observations are held. */
  observationsTruncated: boolean;
  observationsLoading: boolean;
  observationsError: string;
}

export const useNetDiagFleetStore = defineStore("netDiagFleet", {
  state: (): NetDiagFleetState => ({
    aggregateKey: "",
    aggregate: null,
    aggregateLoading: false,
    aggregateError: "",
    observationsKey: "",
    observations: [],
    observationsTruncated: false,
    observationsLoading: false,
    observationsError: "",
  }),

  actions: {
    async loadAggregate(selection: FleetSelection, groupBy: FleetGroupBy): Promise<boolean> {
      // A refresh of the same view keeps the table; another view must not show the old one.
      const key = `${fleetSelectionKey(selection)}|${groupBy}`;
      if (this.aggregateKey !== key) {
        this.aggregateKey = key;
        this.aggregate = null;
        this.aggregateError = "";
      }
      const token = useOauthStore().token;
      return await loadLatest(aggregateSequence, {
        what: "network diagnostic aggregate",
        setLoading: (loading) => {
          this.aggregateLoading = loading;
        },
        fetch: () => networkDiagnosticsService().getAggregate(token, [groupBy], fleetFilters(selection)),
        apply: (aggregate) => {
          this.aggregate = aggregate;
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
