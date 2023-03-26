<template>
  <v-card>
    <v-card-title>
      <span class="text-h5">Edit map files</span>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-data-table
          :headers="headers"
          :items="mapFiles"
          class="elevation-1"
          :hide-default-header="true"
          :hide-default-footer="true"
        >
          <template #[`item.actions`]="{ item }">
            <v-btn color="primary" class="mb-2 w3-race-bg--text" @click="selectMapFile(item)">Select</v-btn>
          </template>
        </v-data-table>

        <div class="mt-5"></div>
        <span class="text-subtitle-1">Add file</span>
        <v-row>
          <v-col cols="12" sm="6" md="12">
            <v-file-input label="Map file" v-model="file"></v-file-input>
          </v-col>

          <v-col cols="12" sm="6" md="12">
            <v-text-field v-model="fileName" label="File name (optional)"></v-text-field>
          </v-col>
        </v-row>
        <v-btn color="primary" class="mb-2 w3-race-bg--text" @click="addMapFile()">Add map file</v-btn>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text @click="cancel">
        {{ $t(`views_admin.cancel`) }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";

@Component({})
export default class EditMapFiles extends Vue {
  @Prop() public map!: Map;

  public fileName = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public file: File = {} as any;
  private mapsManagementStore = useMapsManagementStore();

  public get headers() {
    return [
      {
        text: "File path",
        align: "start",
        value: "filePath",
      },
      { text: "Actions", value: "actions", sortable: false },
    ];
  }

  public get mapFiles() {
    return this.mapsManagementStore.mapFiles;
  }

  public selectMapFile(file: MapFileData) {
    if (confirm(`Are you sure you want to select file with path ${file.filePath}?`)) {
      this.$emit("selected", { map: this.map, file });
    }
  }

  public cancel() {
    this.$emit("cancel");
  }

  public async addMapFile() {
    try {
      const formData = new FormData();
      formData.append("mapId", this.map.id.toString());
      formData.append("mapFile", this.file, this.file.name);
      formData.append("fileName", this.fileName);
      await this.mapsManagementStore.createMapFile(formData);
      await this.mapsManagementStore.loadMapFiles(this.map.id);

      this.fileName = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.file = {} as any;
    } catch {
      alert("Error trying to create map file");
    }
  }

  async mounted(): Promise<void> {
    await this.mapsManagementStore.loadMapFiles(this.map.id);
  }
}
</script>

<style></style>
