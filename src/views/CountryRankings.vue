<template>
  <v-container>
    <v-card class="mt-2 search-bar-container" tile>
      <v-card-title class="search-bar">
        <gateway-select
          @gatewayChanged="onGatewayChanged"
          v-if="isGatewayNeeded"
        />
        <game-mode-select
          :gameMode="selectedGameMode"
          @gameModeChanged="onGameModeChanged"
        ></game-mode-select>
        <v-menu offset-x>
          <template v-slot:activator="{ props }">
            <v-btn tile v-bind="props" style="background-color: transparent">
              <div
                class="country-flag__container"
                v-if="selectedCountry.countryCode"
              >
                <country-flag
                  class="country-flag"
                  :country="selectedCountry.countryCode"
                  size="normal"
                />
              </div>
              {{ selectedCountry.country }}
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <v-list>

                  <v-list-item-title>Select a country:</v-list-item-title>

              </v-list>
              <v-divider></v-divider>
              <v-list density="compact" class="countries-list">
                <v-list-item
                  v-for="item in countries"
                  :key="item.countryCode"
                  @click="selectCountry(item.countryCode)"
                >

                    <v-list-item-title>
                      <span class="country-flag__container">
                        <country-flag
                          class="country-flag"
                          :country="item.countryCode"
                          size="normal"
                        />
                      </span>
                      {{ item.country }}
                    </v-list-item-title>

                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-menu>
        <v-spacer></v-spacer>
        <v-menu offset-x>
          <template v-slot:activator="{ props }">
            <v-btn
              tile
              v-bind="props"
              class="ma-4"
              style="background-color: transparent"
            >
              <h2 class="pa-0">Season {{ selectedSeason.id }}</h2>
              <v-icon class="ml-4">{{ mdiChevronRight }}</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <v-list>

                  <v-list-item-title>Previous seasons:</v-list-item-title>

              </v-list>
              <v-list density="compact">
                <v-list-item
                  v-for="item in seasons"
                  :key="item.id"
                  @click="selectSeason(item)"
                >

                    <v-list-item-title>Season {{ item.id }}</v-list-item-title>

                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-menu>
      </v-card-title>
      <v-card-text>
        <country-rankings-grid
          v-if="!isLoading"
          :rankings="rankings"
          :ongoingMatches="ongoingMatchesMap"
          :selectedCountry="selectedCountry.countryCode"
        ></country-rankings-grid>
        <div class="text-center my-5">
          <v-progress-circular
            indeterminate
            v-if="isLoading"
          ></v-progress-circular>
        </div>
        <div></div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, onUnmounted, PropType, ref, watch } from "vue";
import { CountryRanking, CountryType, Gateways, Season } from "@/store/ranking/types";
import { EGameMode, OngoingMatches } from "@/store/types";
import { Countries } from "@/store/countries";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import GameModeSelect from "@/components/common/GameModeSelect.vue";
import CountryRankingsGrid from "@/components/ladder/CountryRankingsGrid.vue";
import AppConstants from "../constants";
import { useRankingStore } from "@/store/ranking/store";
import { useMatchStore } from "@/store/match/store";
import { useRootStateStore } from "@/store/rootState/store";
import { mdiChevronRight } from "@mdi/js";
import { useRouter } from "vue-router";

// Lazy load.
const CountryFlag = () => import(/* webpackChunkName: "country-flag" */ "vue-country-flag");

export default defineComponent({
  name: "CountryRankingsView",
  components: {
    GatewaySelect,
    GameModeSelect,
    CountryRankingsGrid,
    CountryFlag,
  },
  props: {
    season: {
      type: Number,
      required: true,
    },
    gateway: {
      type: Number as PropType<Gateways>,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const rankingsStore = useRankingStore();
    const matchStore = useMatchStore();
    const rootStateStore = useRootStateStore();
    let _intervalRefreshHandle: NodeJS.Timeout;

    const initialized = ref<boolean>(false);
    const ongoingMatchesMap = ref<OngoingMatches>({});
    const countries = ref<CountryType[]>(Countries);
    const countryRef: ComputedRef<string> = computed((): string => props.country);

    const selectedGameMode: ComputedRef<EGameMode> = computed((): EGameMode => rankingsStore.gameMode);
    const selectedSeason: ComputedRef<Season> = computed((): Season => rankingsStore.selectedSeason);
    const seasons: ComputedRef<Season[]> = computed((): Season[] => rankingsStore.seasons);
    const rankings: ComputedRef<CountryRanking[]> = computed((): CountryRanking[] => rankingsStore.countryRankings);
    const selectedCountryCode: ComputedRef<string> = computed((): string => rankingsStore.selectedCountry);
    const isGatewayNeeded: ComputedRef<boolean> = computed((): boolean => rankingsStore.selectedSeason.id <= 5);

    const selectedCountry: ComputedRef<CountryType> = computed((): CountryType => {
      return countries.value.find((c) => c.countryCode === selectedCountryCode.value) ?? {} as CountryType;
    });

    const currentCountryCode: ComputedRef<string> = computed((): string => {
      // country code of the data being displayed
      return (
        rankings.value[0]?.ranks[0].playersInfo[0].countryCode ||
        rankings.value[0]?.ranks[0].playersInfo[0].location
      );
    });

    const isLoading: ComputedRef<boolean> = computed((): boolean => {
      return (
        (rankingsStore.countryRankingsLoading && selectedCountryCode.value !== currentCountryCode.value) ||
        (!initialized.value && rankings.value.length === 0)
      );
    });

    watch(countryRef, onCountryChanged);
    function onCountryChanged(newValue: string) {
      setCountry(newValue);
    }

    async function onGatewayChanged(): Promise<void> {
      rankingsStore.SET_PAGE(0);
      refreshRankings();
    }


    async function onGameModeChanged(gameMode: EGameMode): Promise<void> {
      await rankingsStore.setGameMode(gameMode);
      refreshRankings();
    }

    function selectCountry(countryCode: string): void {
      router.push(`/Countries?country=${countryCode}`);
    }

    onMounted(async (): Promise<void> => {
      window.scrollTo(0, 0);
      await rankingsStore.retrieveSeasons();

      props.season
        ? rankingsStore.setSeason({ id: props.season })
        : rankingsStore.setSeason(rankingsStore.seasons[0]);

      if (props.gateway) {
        rootStateStore.SET_GATEWAY(props.gateway);
      }

      const country = props.country || selectedCountryCode.value || countries.value[0].countryCode;

      await getLadders();
      await rankingsStore.setCountry(country);
      initialized.value = true;

      await loadOngoingMatches();

      _intervalRefreshHandle = setInterval(async () => {
        await refreshRankings();
      }, AppConstants.ongoingMatchesRefreshInterval);
    });

    onUnmounted((): void => {
      clearInterval(_intervalRefreshHandle);
    });


    async function refreshRankings(): Promise<void> {
      await loadOngoingMatches();
      await getLadders();
      await getRankings();
    }

    async function getRankings(): Promise<void> {
      await rankingsStore.getCountryRankings();
    }

    async function getLadders(): Promise<void> {
      await rankingsStore.retrieveLeagueConstellation();
    }

    async function loadOngoingMatches(): Promise<void> {
      await matchStore.loadAllOngoingMatches();

      ongoingMatchesMap.value = {};
      matchStore.allOngoingMatches.forEach((x) => {
        x.teams.forEach((t) => {
          t.players.forEach((p) => {
            const playerTag = p.battleTag;
            const opponentTeams = x.teams.filter((et) => et != t);
            const opponents = opponentTeams.flatMap((ot) => {
              return ot.players.map((y) => y.battleTag);
            });

            ongoingMatchesMap.value[playerTag] = {
              players: t.players.map((y) => y.battleTag),
              opponents: opponents,
            };
          });
        });
      });
    }

    async function selectSeason(season: Season): Promise<void> {
      rankingsStore.setSeason(season);
      refreshRankings();
    }

    async function setCountry(countryCode: string): Promise<void> {
      await rankingsStore.setCountry(countryCode);
    }

    return {
      mdiChevronRight,
      onGatewayChanged,
      isGatewayNeeded,
      selectedGameMode,
      onGameModeChanged,
      selectedCountry,
      countries,
      selectCountry,
      selectedSeason,
      seasons,
      selectSeason,
      isLoading,
      rankings,
      ongoingMatchesMap,
    };
  },
});
</script>

<style lang="scss" scoped>
.countries-list {
  max-height: 650px;
  overflow-y: auto;
}
.country-flag__container {
  margin-right: 10px;
}
.country-flag {
  margin-bottom: -13px !important;
  margin-top: -10px !important;
}
</style>
