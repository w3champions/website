<template>
  <v-menu location="bottom start">
    <template v-slot:activator="{ props }">
      <v-btn tile class="w3-dropdown-button" style="background-color: transparent" v-bind="props">
        <v-icon size="x-large" start>{{ mdiMap }}</v-icon>
        {{ selected }}
        <v-icon size="18" end>{{ mdiChevronDown }}</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-text class="dropdown-menu-content">
        <div class="dropdown-menu-title">{{ $t("common.selectmap") }}</div>
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

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { MapInfo } from "@/store/common/types";
import { mdiChevronDown, mdiMap } from "@mdi/js";

type MapSelectMap = {
  mapName: string;
  key: string;
};

const { map = "Overall", mapInfo = [] } = defineProps<{
  map?: string;
  mapInfo?: MapInfo[];
}>();

const emit = defineEmits<{
  mapChanged: [map: string];
}>();

const { t } = useI18n();

const selected = computed<string>(() => {
  const match = maps.value.find((m) => m.key === map);
  return match ? match.mapName : "Overall";
});

const maps = computed<MapSelectMap[]>(() => {
  const maps = mapInfo
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
  emit("mapChanged", map);
}
</script>
