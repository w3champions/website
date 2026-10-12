import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import { loadLatest, requestSequence } from "@/store/admin/latest";
import { describeNetDiagError } from "./errors";
import { networkDiagnosticsService } from "./service";
import type { MeasurementDetailDto, MeasurementFilters, MeasurementSummaryDto } from "./types";

// Module level so `$reset()` cannot rewind them (see store/admin/latest.ts).
const listSequence = requestSequence();
const detailSequence = requestSequence();

interface NetDiagMeasurementsState {
  measurements: MeasurementSummaryDto[];
  total: number;
  /** True when the server read only its newest observations to build the list. */
  listTruncated: boolean;
  listLoading: boolean;
  listError: string;
  detail: MeasurementDetailDto | null;
  /** Whether `detail` was loaded with `raw=true`. */
  detailRaw: boolean;
  detailLoading: boolean;
  detailError: string;
}

export const useNetDiagMeasurementsStore = defineStore("netDiagMeasurements", {
  state: (): NetDiagMeasurementsState => ({
    measurements: [],
    total: 0,
    listTruncated: false,
    listLoading: false,
    listError: "",
    detail: null,
    detailRaw: false,
    detailLoading: false,
    detailError: "",
  }),

  actions: {
    async loadMeasurements(filters: MeasurementFilters, page: number, pageSize: number): Promise<boolean> {
      const token = useOauthStore().token;
      return await loadLatest(listSequence, {
        what: "network diagnostic measurements",
        setLoading: (loading) => {
          this.listLoading = loading;
        },
        fetch: () => networkDiagnosticsService().getMeasurements(token, filters, page, pageSize),
        apply: (result) => {
          this.measurements = result.data.items;
          this.total = result.data.total;
          this.listTruncated = result.truncated;
          this.listError = "";
        },
        fail: (e) => {
          this.measurements = [];
          this.total = 0;
          this.listTruncated = false;
          this.listError = describeNetDiagError(e);
        },
      });
    },

    async loadMeasurement(measurementId: string, raw: boolean): Promise<boolean> {
      // Never show another measurement under this id; a raw reload of the same one keeps it visible.
      if (this.detail?.measurementId !== measurementId) {
        this.detail = null;
        this.detailRaw = false;
        this.detailError = "";
      }
      const token = useOauthStore().token;
      return await loadLatest(detailSequence, {
        what: `network diagnostic measurement ${measurementId}`,
        setLoading: (loading) => {
          this.detailLoading = loading;
        },
        fetch: () => networkDiagnosticsService().getMeasurement(token, measurementId, raw),
        apply: (detail) => {
          this.detail = detail;
          this.detailRaw = raw;
          this.detailError = "";
        },
        fail: (e) => {
          this.detailError = describeNetDiagError(e);
        },
      });
    },
  },
});
