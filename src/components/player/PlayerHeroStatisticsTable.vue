<template>
  <div class="player-hero-statistics-table">
    <v-simple-table>
      <template v-slot:default>
        <thead>
          <tr>
            <th v-for="header in headers" :key="header.value" class="text-left">
              {{ header.text }}
            </th>
          </tr>
        </thead>
        <tbody class="player-hero-statistics-table__body">
          <tr v-for="item in heroStatsCurrentPage" :key="item.hero">
            <td v-html="item.image"></td>
            <td v-html="item.name"></td>
            <v-tooltip v-for="header in headersWithoutImageAndName" :key="header.value" top>
              <template v-slot:activator="{ on }">
                <td v-on="on" v-html="item[header.value]"></td>
              </template>
              <div v-if="item.numbers_by_race[header.value]">
                {{ item.numbers_by_race[header.value].number }}/{{ item.numbers_by_race[header.value].total }}
              </div>
            </v-tooltip>
          </tr>
        </tbody>
      </template>
    </v-simple-table>

    <v-pagination
      v-model="page"
      :length="pageLength"
      :prev-icon="mdiMenuLeft"
      :next-icon="mdiMenuRight"
    ></v-pagination>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, ref } from "vue";
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
    const paginationSize = 10;

    const pageOffset: ComputedRef<number> = computed((): number => paginationSize * page.value);
    const pageLength: ComputedRef<number> = computed((): number => Math.ceil(props.heroStatistics.length / paginationSize));
    const heroStatsCurrentPage: ComputedRef<PlayerHeroStatistic[]> = computed((): PlayerHeroStatistic[] => props.heroStatistics.slice((pageOffset.value - paginationSize), pageOffset.value));

    const headers = [
      { text: "", value: "image" },
      { text: "Hero", value: "name" },
      { text: "Total", value: "total" },
      { text: "vs. Human", value: "hu" },
      { text: "vs. Orc", value: "orc" },
      { text: "vs. Undead", value: "ud" },
      { text: "vs. Night Elf", value: "ne" },
      { text: "vs. Random", value: "rand" },
    ] satisfies { text: string, value: keyof PlayerHeroStatistic}[];

    const headersWithoutImageAndName = headers.slice(2) as { text: string, value: keyof NumbersByPlayerHeroStatistic}[];

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
