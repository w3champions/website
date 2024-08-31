import { CloudFile, CloudStorageProvider, CloudStorageState, CloudValidationMessage } from "./types";
import CloudStorageService from "@/services/admin/CloudStorageService";
import { useOauthStore } from "@/store/oauth/store";
import { defineStore } from "pinia";

export const useCloudStorageStore = defineStore("cloudStorage", {
  state: (): CloudStorageState => ({
    files: [] as CloudFile[],
    validationMessage: { message: "", isSuccess: true } as CloudValidationMessage,
  }),
  actions: {
    async fetchFiles(provider: CloudStorageProvider): Promise<void> {
      const oauthStore = useOauthStore();
      const response = await CloudStorageService.fetchFiles(oauthStore.token, provider);
      this.SET_FILES(response);
    },
    async uploadFile(file: File, provider: CloudStorageProvider): Promise<void> {
      const oauthStore = useOauthStore();
      const validationMessage = await CloudStorageService.uploadFile(oauthStore.token, file, provider);
      this.SET_VALIDATION_MESSAGE(validationMessage);
    },
    downloadFile(fileName: string, provider: CloudStorageProvider): void {
      const oauthStore = useOauthStore();
      CloudStorageService.downloadFile(oauthStore.token, fileName, provider);
    },
    async deleteFile(fileName: string, provider: CloudStorageProvider): Promise<void> {
      const oauthStore = useOauthStore();
      const validationMessage = await CloudStorageService.deleteFile(oauthStore.token, fileName, provider);
      this.SET_VALIDATION_MESSAGE(validationMessage);
    },
    resetFiles() {
      this.SET_FILES([]);
    },
    SET_FILES(files: CloudFile[]) {
      this.files = files;
    },
    SET_VALIDATION_MESSAGE(message: CloudValidationMessage) {
      this.validationMessage = message;
    },
  },
});
