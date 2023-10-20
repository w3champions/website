<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items-per-page="10"
      :footer-props="{ itemsPerPageOptions: [10, 100, -1] }"
      :items="fileNames"
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
    <v-alert v-if="validationMessage.successMessage" type="success" dense dismissible class="ml-4 mr-4">
      {{ validationMessage.successMessage }}
    </v-alert>
    <v-alert v-if="validationMessage.errorMessage" type="warning" dense dismissible class="ml-4 mr-4">
      {{ validationMessage.errorMessage }}
    </v-alert>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { useCloudStorageStore } from "@/store/admin/cloudStorage/store";
import { mdiDelete, mdiDownload, mdiCamera } from "@mdi/js";
import { CloudFile, CloudValidationMessage } from "@/store/admin/cloudStorage/types";

@Component({})
export default class AdminStorageAlibaba extends Vue {
  private cloudStorageStore = useCloudStorageStore();
  public dialog = false;
  public mdiDelete = mdiDelete;
  public mdiDownload = mdiDownload;
  public mdiCamera = mdiCamera;
  public fileToUpload = null;

  public headers = [
    { text: "Name", align: "start", sortable: true, value: "name" },
    { text: "Size (KB)", sortable: true, value: "size" },
    { text: "Last Modified", sortable: true, value: "lastModified" },
    { text: "Actions", sortable: false, value: "actions" },
  ];

  get fileNames(): CloudFile[] {
    return this.cloudStorageStore.fileNames;
  }

  async deleteFile(file: CloudFile): Promise<void> {
    confirm("Are you sure you want to delete this item?") &&
    await this.cloudStorageStore.deleteAlibabaFile(file.name);
    await this.loadAlibabaFiles();
  }

  downloadFile(file: CloudFile): void {
    this.cloudStorageStore.downloadAlibabaFile(file.name);
  }

  async uploadFile(): Promise<void> {
    if (!this.fileToUpload) return;
    await this.cloudStorageStore.uploadToAlibaba(this.fileToUpload);
    await this.loadAlibabaFiles();
    this.close();
  }

  public close(): void {
    this.dialog = false;
  }

  get validationMessage(): CloudValidationMessage {
    return this.cloudStorageStore.validationMessage;
  }

  resetValidationMessage() {
    this.cloudStorageStore.validationMessage = { successMessage: "", errorMessage: "" };
  }

  public async loadAlibabaFiles(): Promise<void> {
    await this.cloudStorageStore.fetchAlibabaFiles();
  }

  async mounted(): Promise<void> {
    await this.loadAlibabaFiles();
  }

  destroyed(): void {
    this.resetValidationMessage();
  }
}
</script>

<style lang="scss"></style>
