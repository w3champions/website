<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items-per-page="10"
      :footer-props="{ itemsPerPageOptions: [10, 100, -1] }"
      :items="files"
      sort-by="lastModified"
      :sort-desc="true"
    >
      <template v-slot:top>
        <v-toolbar flat color="transparent">
          <v-spacer></v-spacer>
          <v-dialog v-model="dialog" max-width="500px">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="primary"
                class="mb-2 w3-race-bg--text"
                v-bind="attrs"
                v-on="on"
              >
                Upload Image
              </v-btn>
            </template>

            <v-card>
              <v-card-title>
                <span class="text-h5">Upload Image</span>
              </v-card-title>
              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" sm="6" md="12" class="pb-0">
                      <v-file-input
                        v-model="fileToUpload"
                        :prepend-icon="mdiCamera"
                        accept="image/*"
                        label="Select an image"
                      ></v-file-input>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="close">
                  {{ $t(`views_admin.cancel`) }}
                </v-btn>
                <v-btn color="primary" class="w3-race-bg--text" @click="uploadFile">
                  Upload
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template #[`item.actions`]="{ item }">
        <v-icon small class="mr-3" @click="downloadFile(item)">{{ mdiDownload }}</v-icon>
        <v-icon small @click="deleteFile(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table>
    <v-snackbar v-model="isValidationMessageVisible" top :color="validationMessage.isSuccess ? 'green' : 'red accent-2'">
      {{ validationMessage.message }}
      <template v-slot:action="{ attrs }">
        <v-btn color="black" text v-bind="attrs" @click="resetValidationMessage">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { useCloudStorageStore } from "@/store/admin/cloudStorage/store";
import { mdiDelete, mdiDownload, mdiCamera } from "@mdi/js";
import { CloudFile, CloudValidationMessage, CloudStorageProvider } from "@/store/admin/cloudStorage/types";

@Component({})
export default class AdminStorageS3 extends Vue {
  private cloudStorageStore = useCloudStorageStore();
  public dialog = false;
  public mdiDelete = mdiDelete;
  public mdiDownload = mdiDownload;
  public mdiCamera = mdiCamera;
  public fileToUpload = null;
  public isValidationMessageVisible = false;

  public headers = [
    { text: "Name", align: "start", sortable: true, value: "name" },
    { text: "Size (KB)", sortable: true, value: "size" },
    { text: "Last Modified", sortable: true, value: "lastModified" },
    { text: "Actions", sortable: false, value: "actions" },
  ];

  get files(): CloudFile[] {
    return this.cloudStorageStore.files;
  }

  async deleteFile(file: CloudFile): Promise<void> {
    const confirmation = confirm(`Are you sure you want to delete ${file.name}?`);
    if (!confirmation) return;
    await this.cloudStorageStore.deleteFile(file.name, CloudStorageProvider.S3);
    this.isValidationMessageVisible = true;
    await this.loadFiles();
  }

  downloadFile(file: CloudFile): void {
    this.cloudStorageStore.downloadFile(file.name, CloudStorageProvider.S3);
  }

  async uploadFile(): Promise<void> {
    if (!this.fileToUpload) return;
    await this.cloudStorageStore.uploadFile(this.fileToUpload, CloudStorageProvider.S3);
    this.isValidationMessageVisible = true;
    this.close();
    await this.loadFiles();
  }

  public close(): void {
    this.dialog = false;
  }

  get validationMessage(): CloudValidationMessage {
    return this.cloudStorageStore.validationMessage;
  }

  resetValidationMessage() {
    this.isValidationMessageVisible = false;
    this.cloudStorageStore.validationMessage = { message: "", isSuccess: true };
  }

  public async loadFiles(): Promise<void> {
    await this.cloudStorageStore.fetchFiles(CloudStorageProvider.S3);
  }

  async mounted(): Promise<void> {
    await this.loadFiles();
  }

  destroyed(): void {
    this.resetValidationMessage();
    this.cloudStorageStore.resetFiles();
  }
}
</script>

<style lang="scss"></style>
