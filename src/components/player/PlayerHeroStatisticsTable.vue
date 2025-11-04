<template>
  <div class="player-hero-statistics-table">
    <v-data-table
      hide-default-footer
      :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
    >
      <template v-slot:default>
        <thead>
          <tr>
            <th
              v-for="header in headers"
              :key="header.value"
              :class="`text-${header.align}`"
            >
              {{ header.text }}
            </th>
          </tr>
        </thead>
        <tbody class="player-hero-statistics-table__body">
          <tr v-for="item in heroStatsCurrentPage" :key="item.hero">
            <td>
              <img class="mt-1" :src="item.image" height="40" width="40" />
            </td>
            <td>{{ item.name }}</td>
            <v-tooltip v-for="header in headersWithoutImageAndName" :key="header.value" location="top" content-class="w3-tooltip elevation-1">
              <template v-slot:activator="{ props }">
                <td class="text-right" v-bind="props">{{ item[header.value] }}</td>
              </template>
              <div v-if="item.numbers_by_race[header.value]">
                {{ $t("components_player_playeravatar.games") }} {{ item.numbers_by_race[header.value].number }}
                &nbsp;&nbsp;
                {{ $t("common.total") }} <span class="number-text">{{ item.numbers_by_race[header.value].total }}</span>
              </div>
            </v-tooltip>
          </tr>
        </tbody>
      </template>
    </v-data-table>

    <v-pagination
      v-if="pageLength > 1"
      v-model="page"
      :length="pageLength"
      :prev-icon="mdiMenuLeft"
      :next-icon="mdiMenuRight"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { NumbersByPlayerHeroStatistic, PlayerHeroStatistic } from "@/store/player/types";
import { mdiMenuLeft } from "@mdi/js";
import { mdiMenuRight } from "@mdi/js";

export default defineComponent({
  name: "PlayerHeroStatisticsTable",
  components: {},
  props: {
    heroStatistics: {
      type: Array<PlayerHeroStatistic>,
      required: true,
    },
  },
  setup(props) {
    const page = ref<number>(1);
    const paginationSize = 16;

    const pageOffset = computed<number>(() => paginationSize * page.value);
    const pageLength = computed<number>(() => Math.ceil(props.heroStatistics.length / paginationSize));
    const heroStatsCurrentPage = computed<PlayerHeroStatistic[]>(() => props.heroStatistics.slice((pageOffset.value - paginationSize), pageOffset.value));

    const headers = [
      { text: "", value: "image", align: "left" },
      { text: "Hero", value: "name", align: "left" },
      { text: "Total", value: "total", align: "right" },
      { text: "vs. Human", value: "hu", align: "right" },
      { text: "vs. Orc", value: "orc", align: "right" },
      { text: "vs. Night Elf", value: "ne", align: "right" },
      { text: "vs. Undead", value: "ud", align: "right" },
      { text: "vs. Random", value: "rand", align: "right" },
    ] satisfies { text: string; value: keyof PlayerHeroStatistic; align: "left" | "right" }[];

    const headersWithoutImageAndName = headers.slice(2) as { text: string; value: keyof NumbersByPlayerHeroStatistic }[];

    return {
      mdiMenuLeft,
      mdiMenuRight,
      headers,
      heroStatsCurrentPage,
      headersWithoutImageAndName,
      page,
      pageLength,
    };
  },
});
</script>
