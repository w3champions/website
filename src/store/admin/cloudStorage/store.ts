import { CloudStorageState, CloudFile, CloudValidationMessage } from "./types";
import CloudStorageService from "@/services/admin/CloudStorageService";
import { useOauthStore } from "@/store/oauth/store";
import { defineStore } from "pinia";

export const useCloudStorageStore = defineStore("cloudStorage", {
  state: (): CloudStorageState => ({
    fileNames: [],
    validationMessage: { successMessage: "", errorMessage: "" } as CloudValidationMessage,
  }),
  actions: {
    async fetchAlibabaFiles(): Promise<void> {
      const oauthStore = useOauthStore();
      const response = await CloudStorageService.fetchAlibabaFiles(oauthStore.token);
      this.SET_FILE_NAMES(response);
    },
    async uploadToAlibaba(file: File): Promise<void> {
      const oauthStore = useOauthStore();
      const responseMessage = await CloudStorageService.uploadToAlibaba(oauthStore.token, file);
      this.SET_RESPONSE_MESSAGE(responseMessage);
    },
    downloadAlibabaFile(fileName: string): void {
      const oauthStore = useOauthStore();
      CloudStorageService.downloadAlibabaFile(oauthStore.token, fileName);
    },
    async deleteAlibabaFile(fileName: string): Promise<void> {
      const oauthStore = useOauthStore();
      const responseMessage = await CloudStorageService.deleteAlibabaFile(oauthStore.token, fileName);
      this.SET_RESPONSE_MESSAGE(responseMessage);
    },
    SET_FILE_NAMES(fileNames: CloudFile[]) {
      this.fileNames = fileNames;
    },
    SET_RESPONSE_MESSAGE(message: CloudValidationMessage) {
      this.validationMessage = message;
    },
  },
});
