import { ServerLogsState } from "@/store/admin/serverLogs/types";
import ServerLogsService from "@/services/admin/ServerLogsService";
import { useOauthStore } from "@/store/oauth/store";
import { defineStore } from "pinia";

export const useServerLogsStore = defineStore("serverLogs", {
  state: (): ServerLogsState => ({
    logfileNames: [],
  }),
  actions: {
    async fetchLogfileNames(): Promise<void> {
      const oauthStore = useOauthStore();
      const response = await ServerLogsService.fetchLogfileNames(oauthStore.token);
      this.SET_LOGFILE_NAMES(response);
    },
    async fetchLogContent(logfileName: string): Promise<string[]> {
      const oauthStore = useOauthStore();
      const lines = await ServerLogsService.fetchLogContent(oauthStore.token, logfileName);
      return lines;
    },
    downloadLog(logfileName: string): void {
      const oauthStore = useOauthStore();
      ServerLogsService.downloadLogfile(oauthStore.token, logfileName);
    },
    SET_LOGFILE_NAMES(logfileNames: string[]) {
      this.logfileNames = logfileNames;
    },
  },
});
