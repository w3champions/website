<template>
  <v-menu location="bottom end" transition="fade-transition" :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-tooltip location="top" content-class="w3-tooltip elevation-1" transition="none">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn
            tile
            class="w3-dropdown-button table-options-button"
            style="background-color: transparent"
            :aria-label="$t('components_matches_tableoptions.title')"
            v-bind="{ ...props, ...tooltipProps }"
          >
            <v-icon size="x-large" start class="table-options-button__icon">{{ mdiTableCog }}</v-icon>
            <span class="table-options-button__label">{{ $t("components_matches_tableoptions.button") }}</span>
            <v-icon size="18" end class="table-options-button__chevron">{{ mdiChevronDown }}</v-icon>
          </v-btn>
        </template>
        <span>{{ $t("components_matches_tableoptions.title") }}</span>
      </v-tooltip>
    </template>

    <v-card min-width="320">
      <v-card-text class="table-options-menu pb-2">
        <div class="text-subtitle-2 mb-2">{{ $t("components_matches_tableoptions.title") }}</div>
        <v-list density="compact" class="pa-0">
          <v-list-item v-if="!unfinished" class="px-0">
            <template v-slot:prepend>
              <v-icon size="20">{{ mdiTrophy }}</v-icon>
            </template>
            <v-list-item-title>{{ $t("components_matches_tableoptions.hideWinner") }}</v-list-item-title>
            <template v-slot:append>
              <v-switch
                :model-value="hideWinner"
                hide-details
                density="compact"
                color="primary"
                :aria-label="$t('components_matches_tableoptions.hideWinner')"
                @update:model-value="onHideWinnerChanged"
              />
            </template>
          </v-list-item>

          <v-list-item v-if="!unfinished" class="px-0">
            <template v-slot:prepend>
              <v-icon size="20">{{ mdiTimerOutline }}</v-icon>
            </template>
            <v-list-item-title>{{ $t("components_matches_tableoptions.hideDuration") }}</v-list-item-title>
            <template v-slot:append>
              <v-switch
                :model-value="hideDuration"
                hide-details
                density="compact"
                color="primary"
                :aria-label="$t('components_matches_tableoptions.hideDuration')"
                @update:model-value="onHideDurationChanged"
              />
            </template>
          </v-list-item>

          <v-list-item class="px-0">
            <template v-slot:prepend>
              <v-icon size="20">{{ mdiClockOutline }}</v-icon>
            </template>
            <v-list-item-title>{{ $t("components_matches_tableoptions.timeSince") }}</v-list-item-title>
            <template v-slot:append>
              <v-switch
                :model-value="showRelativeStartTime"
                hide-details
                density="compact"
                color="primary"
                :aria-label="$t('components_matches_tableoptions.timeSince')"
                @update:model-value="onRelativeStartTimeChanged"
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
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { mdiChevronDown, mdiClockOutline, mdiEye, mdiTableCog, mdiTimerOutline, mdiTrophy } from "@mdi/js";
import { useTableOptionsStore } from "@/store/tableOptions/store";
import { useSpoilerFreeStore } from "@/store/spoilerFree/store";

defineProps<{
  unfinished?: boolean;
}>();

const tableOptionsStore = useTableOptionsStore();
const spoilerFreeStore = useSpoilerFreeStore();

const hideWinner = computed<boolean>(() => spoilerFreeStore.hideWinner);
const hideDuration = computed<boolean>(() => spoilerFreeStore.hideDuration);
const showHeroes = computed<boolean>(() => tableOptionsStore.showHeroes);
const showRelativeStartTime = computed<boolean>(() => tableOptionsStore.showRelativeStartTime);

function onHideWinnerChanged(value: boolean | null): void {
  if (value !== null) {
    spoilerFreeStore.setHideWinner(value);
  }
}

function onHideDurationChanged(value: boolean | null): void {
  if (value !== null) {
    spoilerFreeStore.setHideDuration(value);
  }
}

function onRelativeStartTimeChanged(value: boolean | null): void {
  if (value !== null) {
    tableOptionsStore.setShowRelativeStartTime(value);
  }
}

function onHeroesChanged(value: boolean | null): void {
  if (value !== null) {
    tableOptionsStore.setShowHeroes(value);
  }
}

</script>

<style lang="scss" scoped>
.table-options-button {
  min-height: 36px;
}

.table-options-menu :deep(.v-list-item__prepend) {
  width: 32px;
}

.table-options-menu :deep(.v-list-item__append) {
  margin-left: 16px;
  padding-right: 8px;
}

@media (max-width: 959px) {
  .table-options-button {
    min-width: 48px;
    padding-right: 0;
    padding-left: 0;
  }

  .table-options-button__icon {
    margin-inline-end: 0;
  }

  .table-options-button__chevron {
    display: none;
  }

  .table-options-button__label {
    display: none;
  }
}
</style>
