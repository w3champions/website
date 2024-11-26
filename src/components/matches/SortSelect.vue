<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" style="background-color: transparent">
        <v-icon class="mr-1">{{mdiSortVariant}}</v-icon>
        {{ currentSort.name }}
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
        <v-list dense max-height="400" class="overflow-y-auto">
          <v-list-item v-for="sort in sortings" :key="sort.mode" @click="currentSort = sort">
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
import { computed, defineComponent } from "vue";
import { SortMode } from "@/store/match/types";
import { useMatchStore } from "@/store/match/store";
import { mdiSortVariant } from "@mdi/js";
import { useI18n } from "vue-i18n-bridge";
import { TranslateResult } from "vue-i18n";

interface SortSelectData {
  name: TranslateResult;
  mode: SortMode;
}

export default defineComponent({
  name: "SortSelect",
  components: {},
  props: ['sortings'],
  setup(props) {
    const { t } = useI18n();
    const matchStore = useMatchStore();

    const currentSort = computed<SortSelectData>({
      get(): SortSelectData {
        const selectedSort = matchStore.sort;
        return sortings.value.find((sort) => sort.mode == selectedSort)!;
      },
      set(val: SortSelectData): void {
        matchStore.setSort(val.mode);
      },
    });

    const sortings = computed<SortSelectData[]>(() => ([
      {
        name: t(`components_matches_sortselect.starttime`),
        mode: SortMode.startTime,
      },
      {
        name: t(`components_matches_sortselect.endtime`),
        mode: SortMode.endTime,
      },
      {
        name: t(`components_matches_sortselect.mmr`),
        mode: SortMode.mmr,
      },
    ].filter(s => props.sortings.includes(s.mode))));

    return {
      mdiSortVariant,
      currentSort,
      sortings,
    };
  },
});
</script>
