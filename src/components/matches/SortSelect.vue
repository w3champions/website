<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" style="background-color: transparent">
        <v-icon class="mr-1">mdi-sort-ascending</v-icon>
        {{ sortName }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>{{ $t("components_matches_sortselect.sortmatchesby") }}</v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider></v-divider>
        <v-list dense>
          <v-list-item v-for="sort in sortings" :key="sort.mode" @click="setSort(sort.mode)">
            <v-list-item-content>
              <v-list-item-title>{{ sort.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { SortMode } from "@/store/match/types";
import { useMatchStore } from "@/store/match/store";

@Component({})
export default class MapSelect extends Vue {
  private matchStore = useMatchStore();

  get sortName() {
    const selectedSort = this.matchStore.sort;
    return this.sortings.find((sort) => sort.mode == selectedSort)!.name;
  }

  get sortings() {
    return [
      {
        name: this.$t(`components_matches_sortselect.starttimedescending`),
        mode: SortMode.startTimeDescending,
      },
      {
        name: this.$t(`components_matches_sortselect.mmrdescending`),
        mode: SortMode.mmrDescending,
      },
    ];
  }

  public setSort(sort: string): void {
    this.matchStore.setSort(sort);
  }
}
</script>

<style></style>
