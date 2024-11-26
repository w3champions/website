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
          <v-list-item-content>
            <v-list-item-title>{{ $t("common.selectmap") }}</v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider></v-divider>
        <v-list dense max-height="400" class="overflow-y-auto">
          <v-list-item v-for="(m, index) in maps" :key="index" @click="selectMap(m.mapName)">
            <v-list-item-content>
              <v-list-item-title>{{ m.displayName }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { TranslateResult } from "vue-i18n";
import { MapInfo } from "@/store/common/types";
import { mdiMap } from "@mdi/js";
import _uniqBy from 'lodash/uniqBy';
import _sortBy from 'lodash/sortBy';

type MapSelectMap = {
  displayName: TranslateResult;
  mapName: string;
  key: string;
};

export default defineComponent({
  name: "MapSelect",
  props: {
    map: {
      type: String,
      required: false,
      default: "Overall",
    },
    mapInfo: {
      type: Array<MapInfo>,
      required: false,
      default: [],
    },
  },
  setup: (props, context) => {
    const { t } = useI18n();
    const selected = computed<string | TranslateResult>(() => {
      const match = maps.value.find((m) => m.mapName === props.map);
      return match ? match.mapName : "Overall";
    });

    // Only include unique maps that has a mapName definition
    const maps = computed<MapSelectMap[]>(() => {
      const maps = _sortBy(_uniqBy(props.mapInfo
          .filter((map) => map.mapName)
          .map((map) => ({mapName: map.mapName, key: map.map, displayName: map.mapName })), 'mapName'), 'mapName');
      return [{ displayName: t("mapNames.Overall"), mapName: 'Overall', key: "Overall" }, ...maps];
    });

    function selectMap(map: string): void {
      context.emit("mapChanged", map);
    }

    return {
      mdiMap,
      selected,
      maps,
      selectMap,
    };
  },
});
</script>

<style></style>
