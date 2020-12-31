<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" style="background-color: transparent;">
        <v-icon style="margin-right: 5px;">mdi-map</v-icon>
        {{ selected }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>Select a map:</v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider></v-divider>
        <v-list dense>
          <v-list-item
            v-for="m in maps"
            :key="m.key"
            @click="selectMap(m.key)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ m.mapName }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from "vue";
import { TranslateResult } from "vue-i18n";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class MapSelect extends Vue {
  @Prop() map = "Overall";

  get selected(): string | TranslateResult {
      const match = this.maps.find(m => m.key === this.map)
      return match ? match.mapName : "";
  }

  get maps(): { mapName: TranslateResult, key: string }[] {
    return [
      {
        mapName: this.$t("mapNames.Overall"),
        key: "Overall"
      },
      {
        mapName: this.$t("mapNames.amazonia"),
        key: "amazonia"
      },
      {
        mapName: this.$t("mapNames.autumnleaves201016"),
        key: "autumnleaves201016"
      },
      {
        mapName: this.$t("mapNames.concealedhill"),
        key: "concealedhill"
      },
      {
        mapName: this.$t("mapNames.echoisles"),
        key: "echoisles"
      },
      {
        mapName: this.$t("mapNames.lastrefuge"),
        key: "lastrefuge"
      },
      {
        mapName: this.$t("mapNames.northernisles"),
        key: "northernisles",
      },
      {
        mapName: this.$t("mapNames.ruinsofazshara201016"),
        key: "ruinsofazshara201016"
      },
      {
        mapName: this.$t("mapNames.terenasstand"),
        key: "terenasstand"
      },
      {
        mapName: this.$t("mapNames.turtlerock"),
        key: "turtlerock"
      },
      {
        mapName: this.$t("mapNames.twistedmeadows"),
        key: "twistedmeadows"
      },
    ];
  }

  public selectMap(map: string): void {
    this.$emit("mapChanged", map);
  }
}
</script>

<style></style>
