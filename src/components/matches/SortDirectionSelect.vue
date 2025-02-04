<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" style="background-color: transparent">
        <v-icon class="mr-1">{{currentDirection.icon}}</v-icon>
        {{ currentDirection.name }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>{{ $t("components_matches_sort_direction_select.sortmatchesinorder") }}</v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider></v-divider>
        <v-list dense max-height="400" class="overflow-y-auto">
          <v-list-item v-for="direction in directions" :key="direction.value" @click="currentDirection = direction">
            <v-list-item-content>
              <v-list-item-title>{{ direction.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useMatchStore } from "@/store/match/store";
import { mdiSortAscending, mdiSortDescending } from "@mdi/js";
import {SortDirection } from "@/store/match/types";
import {useI18n} from "vue-i18n-bridge";
import {TranslateResult} from "vue-i18n";

interface SortDirectionSelectData {
  name: TranslateResult;
  value: SortDirection;
  icon: string;
}

export default defineComponent({
  name: "SortDirectionSelect",
  setup: () => {
    const { t } = useI18n();
    const matchStore = useMatchStore();

    const currentDirection = computed<SortDirection>({
      get(): SortDirectionSelectData {
        const selectedDirection = matchStore.sortDirection;
        return directions.find((direction) => direction.value == selectedDirection)!;
      },
      set(dir: SortDirectionSelectData): void {
        matchStore.setSortDirection(dir.value);
      },
    });

    const directions: SortDirectionSelectData[] = [
      {
        name: t(`components_matches_sort_direction_select.ascending`),
        value: SortDirection.Ascending,
        icon: mdiSortAscending
      },
      {
        name: t(`components_matches_sort_direction_select.descending`),
        value: SortDirection.Descending,
        icon:mdiSortDescending
      },
    ];

    return {
      currentDirection,
      directions,
    };
  },
});
</script>
