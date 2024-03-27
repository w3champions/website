<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" style="background-color: transparent">
        <v-icon style="margin-right: 5px">{{ mdiMap }}</v-icon>
        {{ selected }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-title>{{ $t("common.selectmap") }}</v-list-item-title>
        </v-list>
        <v-divider></v-divider>
        <v-list dense>
          <v-list-item v-for="m in maps" :key="m.key" @click="selectMap(m.key)">
            <v-list-item-title>{{ m.mapName }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { TranslateResult } from "vue-i18n";
import { Component, Prop, Vue } from "vue-facing-decorator";
import { MapInfo } from "@/store/common/types";
import { mdiMap } from "@mdi/js";

@Component({})
export default class MapSelect extends Vue {
  @Prop({ default: "Overall" }) map?: string;
  @Prop({ default: [] }) mapInfo!: Array<MapInfo>;
  public mdiMap = mdiMap;

  get selected(): string | TranslateResult {
    const match = this.maps.find((m) => m.key === this.map);
    return match ? match.mapName : "Overall";
  }

  get maps(): { mapName: TranslateResult; key: string }[] {
    const maps = this.mapInfo
      .map((map) => ({ mapName: (map.mapName ?? map.map), key: map.map }))
      .sort((mapA, mapB) => {
        const nameA = mapA.mapName.toString().toUpperCase();
        const nameB = mapB.mapName.toString().toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
    return [{ mapName: this.$t("mapNames.Overall"), key: "Overall" }, ...maps];
  }

  public selectMap(map: string): void {
    this.$emit("mapChanged", map);
  }
}
</script>

<style></style>
