<template>
  <v-menu location="bottom end" transition="fade-transition" :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-tooltip location="top" content-class="w3-tooltip elevation-1" transition="none">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn
            icon
            tile
            density="comfortable"
            class="w3-dropdown-button"
            style="background-color: transparent"
            :aria-label="$t('components_matches_tableoptions.title')"
            v-bind="{ ...props, ...tooltipProps }"
          >
            <v-icon>{{ mdiTableCog }}</v-icon>
          </v-btn>
        </template>
        <span>{{ $t("components_matches_tableoptions.title") }}</span>
      </v-tooltip>
    </template>

    <v-card min-width="280">
      <v-card-text class="table-options-menu pb-2">
        <div class="text-subtitle-2 mb-2">{{ $t("components_matches_tableoptions.title") }}</div>
        <v-list density="compact" class="pa-0">
          <v-list-item class="px-0">
            <template v-slot:prepend>
              <v-icon size="20">{{ mdiFlag }}</v-icon>
            </template>
            <v-list-item-title>{{ $t("components_matches_tableoptions.countryFlags") }}</v-list-item-title>
            <template v-slot:append>
              <v-switch
                :model-value="showCountryFlags"
                hide-details
                density="compact"
                color="primary"
                :aria-label="$t('components_matches_tableoptions.countryFlags')"
                @update:model-value="onCountryFlagsChanged"
              />
            </template>
          </v-list-item>

          <v-list-item class="px-0">
            <template v-slot:prepend>
              <v-icon size="20">{{ mdiServerNetwork }}</v-icon>
            </template>
            <v-list-item-title>{{ $t("components_matches_tableoptions.serverInfo") }}</v-list-item-title>
            <template v-slot:append>
              <v-switch
                :model-value="showServerInfo"
                hide-details
                density="compact"
                color="primary"
                :aria-label="$t('components_matches_tableoptions.serverInfo')"
                @update:model-value="onServerInfoChanged"
              />
            </template>
          </v-list-item>

          <v-list-item v-if="!unfinished" class="px-0">
            <template v-slot:prepend>
              <v-icon size="20">{{ mdiEye }}</v-icon>
            </template>
            <v-list-item-title>{{ $t("components_matches_tableoptions.heroes") }}</v-list-item-title>
            <template v-slot:append>
              <v-switch
                :model-value="showHeroes"
                hide-details
                density="compact"
                color="primary"
                :aria-label="$t('components_matches_tableoptions.heroes')"
                @update:model-value="onHeroesChanged"
              />
            </template>
          </v-list-item>

          <v-list-item class="px-0">
            <template v-slot:prepend>
              <v-icon size="20">{{ mdiAccountTag }}</v-icon>
            </template>
            <v-list-item-title>{{ $t("components_matches_tableoptions.playerAliases") }}</v-list-item-title>
            <template v-slot:append>
              <v-switch
                :model-value="showPlayerAliases"
                hide-details
                density="compact"
                color="primary"
                :aria-label="$t('components_matches_tableoptions.playerAliases')"
                @update:model-value="onPlayerAliasesChanged"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { mdiAccountTag, mdiEye, mdiFlag, mdiServerNetwork, mdiTableCog } from "@mdi/js";
import { useTableOptionsStore } from "@/store/tableOptions/store";

defineProps<{
  unfinished?: boolean;
}>();

const tableOptionsStore = useTableOptionsStore();

const showCountryFlags = computed<boolean>(() => tableOptionsStore.showCountryFlags);
const showServerInfo = computed<boolean>(() => tableOptionsStore.showServerInfo);
const showHeroes = computed<boolean>(() => tableOptionsStore.showHeroes);
const showPlayerAliases = computed<boolean>(() => tableOptionsStore.showPlayerAliases);

function onCountryFlagsChanged(value: boolean | null): void {
  if (value !== null) {
    tableOptionsStore.setShowCountryFlags(value);
  }
}

function onServerInfoChanged(value: boolean | null): void {
  if (value !== null) {
    tableOptionsStore.setShowServerInfo(value);
  }
}

function onHeroesChanged(value: boolean | null): void {
  if (value !== null) {
    tableOptionsStore.setShowHeroes(value);
  }
}

function onPlayerAliasesChanged(value: boolean | null): void {
  if (value !== null) {
    tableOptionsStore.setShowPlayerAliases(value);
  }
}
</script>

<style lang="scss" scoped>
.table-options-menu :deep(.v-list-item__prepend) {
  width: 32px;
}

.table-options-menu :deep(.v-list-item__append) {
  margin-left: 16px;
}
</style>
