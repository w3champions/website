<template>
  <v-menu location="right">
    <template v-slot:activator="{ props }">
      <v-btn tile style="background-color: transparent" v-bind="props">
        <v-icon size="large" start>{{ mdiMap }}</v-icon>
        {{ selected }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-title>{{ $t("common.selectmap") }}</v-list-item-title>
        </v-list>
        <v-divider />
        <v-list density="compact" max-height="400" class="overflow-y-auto">
          <v-list-item v-for="(m, index) in maps" :key="index" @click="selectMap(m.key)">
            <v-list-item-title>{{ m.mapName }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useI18n } from "vue-i18n";
import { TranslateResult } from "vue-i18n";
import { MapInfo } from "@/store/common/types";
import { mdiMap } from "@mdi/js";

type MapSelectMap = {
  mapName: TranslateResult;
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
      const match = maps.value.find((m) => m.key === props.map);
      return match ? match.mapName : "Overall";
    });

    const maps = computed<MapSelectMap[]>(() => {
      const maps = props.mapInfo
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
      return [{ mapName: t("mapNames.Overall"), key: "Overall" }, ...maps];
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
