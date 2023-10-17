import { ServerLogsState } from "@/store/admin/serverLogs/types";
import ServerLogsService from "@/services/ServerLogsService";
import { useOauthStore } from "@/store/oauth/store";
import { defineStore } from "pinia";

export const useServerLogsStore = defineStore("serverLogs", {
  state: (): ServerLogsState => ({
    logfileNames: [],
    logContent: [],
  }),
  actions: {
    async fetchLogfileNames(): Promise<void> {
      const oauthStore = useOauthStore();
      const response = await ServerLogsService.fetchLogfileNames(oauthStore.token);
      this.SET_LOGFILE_NAMES(response);
    },
    async fetchLogContent(logfileName: string): Promise<void> {
      const oauthStore = useOauthStore();
      const lines = await ServerLogsService.fetchLogContent(oauthStore.token, logfileName);
      this.SET_LOG_CONTENT(lines);
    },
    downloadLog(logfileName: string): void {
      const oauthStore = useOauthStore();
      ServerLogsService.downloadLogfile(oauthStore.token, logfileName);
    },
    SET_LOGFILE_NAMES(logfileNames: string[]) {
      this.logfileNames = logfileNames;
    },
    SET_LOG_CONTENT(content: string[]) {
      this.logContent = content;
    },
  },
});
