<template>
  <v-container>
    <v-card class="pa-md-4">
      <v-text-field label="Search" v-model="search" @input="onSearchChange"></v-text-field>
      <v-data-table
        :headers="headers"
        :items="maps"
        :items-per-page="10"
        :server-items-length="totalMaps"
        class="elevation-1"
      >
        <template>
          <v-icon small class="mr-2">mdi-pencil</v-icon>
          <v-icon small>mdi-delete</v-icon>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class AdminMaps extends Vue {
  search?: string = "";

  get headers() {
    return [
      {
        text: "Map name",
        align: "start",
        value: "name",
      },
      { text: "Actions", value: "actions", sortable: false },
    ];
  }

  get maps() {
    return this.$store.direct.state.admin.mapsManagement.maps;
  }

  get totalMaps() {
    return this.$store.direct.state.admin.mapsManagement.totalMaps;
  }

  onSearchChange() {
    this.$store.direct.dispatch.admin.mapsManagement.loadMaps(this.search);
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
