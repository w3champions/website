import { defineStore } from "pinia";
import { useOauthStore } from "@/store/oauth/store";
import LagReportService from "@/services/admin/LagReportService";
import { LagReportQueryParams, LagReportsState } from "./types";

export const useLagReportsStore = defineStore("lagReports", {
  state: (): LagReportsState => ({
    reports: [],
    total: 0,
    loading: false,
    selectedReport: null,
    selectedReportLoading: false,
  }),

  actions: {
    async loadReports(params: LagReportQueryParams) {
      this.loading = true;
      try {
        const oauthStore = useOauthStore();
        const response = await LagReportService.getReports(oauthStore.token, params);
        this.reports = response.items;
        this.total = response.total;
      } finally {
        this.loading = false;
      }
    },

    async loadReport(id: string) {
      this.selectedReportLoading = true;
      try {
        const oauthStore = useOauthStore();
        this.selectedReport = await LagReportService.getReport(oauthStore.token, id);
      } finally {
        this.selectedReportLoading = false;
      }
    },
  },
});
