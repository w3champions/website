<template>
  <v-container>
    <v-card class="pa-md-4">
      <v-btn color="primary" class="mb-2 w3-race-bg--text" @click="addMap">Add map</v-btn>
      <v-dialog v-if="isEditOpen" v-model="isEditOpen" max-width="800px">
        <edit-map v-if="isEditOpen" :map="editedMap" @cancel="closeEdit" @save="saveMap"></edit-map>
      </v-dialog>

      <v-dialog v-if="isEditFilesOpen" v-model="isEditFilesOpen" max-width="800px">
        <edit-map-files :map="editedMap" @cancel="closeEditFiles" @selected="mapFileSelected"></edit-map-files>
      </v-dialog>

      <v-text-field label="Search" v-model="search"></v-text-field>
      <v-data-table
        :headers="headers"
        :items="maps"
        :items-per-page="10"
        :footer-props="{ itemsPerPageOptions: [10, 25, 50, -1] }"
        class="elevation-1"
      >
        <template #[`item.path`]="{ item }">
          {{ getMapPath(item) }}
        </template>
        <template #[`item.actions`]="{ item }">
          <v-icon small class="mr-2" @click="editMap(item)">mdi-pencil</v-icon>
          <v-icon small class="mr-2" @click="editMapFiles(item)">mdi-file</v-icon>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { Map, MapFileData } from "@/store/admin/maps/types";
import Vue from "vue";
import { Component } from "vue-property-decorator";
import EditMap from "./maps/EditMap.vue";
import EditMapFiles from "./maps/EditMapFiles.vue";
import _ from "lodash";

@Component({ components: { EditMap, EditMapFiles } })
export default class AdminMaps extends Vue {
  public search?: string = "";
  public editedMap?: Map = {} as Map;
  public isEditOpen = false;
  public isEditFilesOpen = false;

  public get headers() {
    return [
      {
        text: "Map name",
        align: "start",
        value: "name",
      },
      {
        text: "Category",
        align: "start",
        value: "category",
      },
      { text: "File", value: "path", sortable: false },
      { text: "Actions", value: "actions", sortable: false },
    ];
  }

  public get maps() {
    return _.isUndefined(this.search)
      ? this.$store.direct.state.admin.mapsManagement.maps
      : this.$store.direct.state.admin.mapsManagement.maps.filter((m) => {
        return m.category?.toLowerCase().includes(this.search!.toLowerCase()) ||
               m.name.toLowerCase().includes(this.search!.toLowerCase());
      });
  }

  public get totalMaps() {
    return this.$store.direct.state.admin.mapsManagement.totalMaps;
  }

  public getMapPath(map: Map) {
    const path = map?.gameMap?.path;

    if (path) {
      return path.replaceAll("maps\\", "").replaceAll("\\", "/");
    }

    return "";
  }

  public addMap() {
    this.isEditOpen = true;
    this.editedMap = this.createDefaultMap();
  }

  public editMap(map: Map) {
    this.isEditOpen = true;
    this.editedMap = map;
  }

  public editMapFiles(map: Map) {
    this.isEditFilesOpen = true;
    this.editedMap = map;
  }

  public closeEdit() {
    this.isEditOpen = false;
  }

  public closeEditFiles() {
    this.isEditFilesOpen = false;
  }

  public async saveMap(map: Map) {
    try {
      if (map.id === -1) {
        await this.$store.direct.dispatch.admin.mapsManagement.createMap(map);
      } else {
        await this.$store.direct.dispatch.admin.mapsManagement.updateMap(map);
      }

      this.isEditOpen = false;
    } catch {
      alert("Error trying to save map");
    }
  }

  public async mapFileSelected(e: { map: Map; file: MapFileData }) {
    const map = e.map as Map;
    const file = e.file as MapFileData;

    map.gameMap = file.metaData;
    map.gameMap.path = `maps\\${file.filePath.replaceAll("/", "\\")}`;

    await this.saveMap(map);
    this.closeEditFiles();
  }

  private createDefaultMap() {
    const map: Map = {
      id: -1,
      name: "",
      category: "",
      maxTeams: 2,
      mappedForces: [],
    };

    return map;
  }

  async mounted(): Promise<void> {
    await this.init();
  }

  private async init(): Promise<void> {
    await this.$store.direct.dispatch.admin.mapsManagement.loadMaps();
  }
}
</script>

<style lang="scss"></style>
