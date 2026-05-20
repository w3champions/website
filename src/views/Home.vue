<template>
  <v-container class="pt-3 px-3 pb-0 w3-container-width">
    <!-- ── Hero row: main card + top ranks ───────────────────────────── -->
    <div class="home-hero-grid">
      <v-card class="w3-plaque hero-card">
        <page-hero
          :eyebrow="currentSeasonId ? `Season ${currentSeasonId} · Now Open` : undefined"
          :title="$t('views_home.w3c_motto')"
          :subtitle="$t('views_home.homebody1')"
        />
        <hr class="w3-gilt-rule mx-6 mt-0 mb-4" />
        <div class="download-row">
          <v-btn
            height="64px"
            class="join-button px-10"
            @click="goToSetupPage"
          >
            {{ $t("views_home.join_button") }}
          </v-btn>
          <v-btn
            height="48px"
            class="join-button--alt px-8"
            @click="goToSetupPage"
          >
            ⚒ {{ $t("views_app.setup_guides") }}
          </v-btn>
        </div>
        <div class="meta-line">WIN · MAC</div>
      </v-card>

      <div class="topranks-column">
        <v-card class="w3-plaque topranks-card">
          <h2 class="banner pt-3 px-4">{{ $t("views_home.topranks") }}</h2>
          <div
            v-for="(rank, i) in topFive"
            :key="i"
            class="proto-rank-row"
            @click="goToProfile(rank)"
          >
            <span :class="['proto-pos', { 'proto-pos--gold': i === 0 }]">{{ i + 1 }}</span>
            <div class="proto-info">
              <div class="proto-avatar">{{ rank.player.name[0].toUpperCase() }}</div>
              <div>
                <div class="proto-name">{{ rank.player.name }}</div>
                <div class="proto-wl">
                  {{ $t("views_home.wlt") }}: {{ rank.player.wins }}/{{ rank.player.losses }}/{{ rank.player.games }}
                </div>
              </div>
            </div>
            <span class="proto-mmr">{{ rank.player.mmr }}</span>
          </div>
          <div class="pa-3 pt-2">
            <v-btn
              class="join-button--alt"
              style="width: 100%; justify-content: center;"
              @click="goToRankings"
            >
              View Full Ladder →
            </v-btn>
          </div>
        </v-card>
        <top-ongoing-matches-with-streams class="mt-3" />
      </div>
    </div>

    <!-- ── News carousel ─────────────────────────────────────────────── -->
    <v-card class="w3-plaque mt-4">
      <v-card-text>
        <v-carousel
          v-model="model"
          :show-arrows="false"
          height="400px"
          hide-delimiter-background
        >
          <v-carousel-item v-for="newsItem in news.slice(0,8)" :key="newsItem.date">
            <v-card-title class="news-date">{{ newsItem.date }}</v-card-title>
            <div v-html="convertMarkdownToHTML(newsItem.message)"></div>
          </v-carousel-item>
        </v-carousel>
      </v-card-text>
    </v-card>

    <!-- ── Unified 2-col grid: left content / right sidebar ─────────── -->
    <div class="bottom-grid mt-4">
      <!-- left col row 1: community text -->
      <v-card class="w3-plaque">
        <v-card-text>
          <div class="community-inner">
            <div class="community-text">
              <h2 class="banner mb-3">{{ $t("views_home.hometitle") }}</h2>
              {{ $t("views_home.homebody1") }}
              <br /><br />
              {{ $t("views_home.homebody2") }}
              <ul>
                <li>{{ $t("views_home.homebody3") }}</li>
                <li>{{ $t("views_home.homebody4") }}</li>
                <li>{{ $t("views_home.homebody5") }}</li>
                <li>{{ $t("views_home.homebody6") }}</li>
                <li>{{ $t("views_home.homebody7") }}</li>
                <li>{{ $t("views_home.homebody8") }}</li>
                <li>{{ $t("views_home.homebody9") }}</li>
                <li>{{ $t("views_home.homebody10") }}</li>
                <li>{{ $t("views_home.homebody11") }}</li>
                <li>{{ $t("views_home.homebody13") }}</li>
              </ul>
              <br />
              {{ $t("views_home.homebody12") }}
              <ul>
                <li>{{ $t("views_home.homebody14") }}</li>
              </ul>
              <br />
              {{ $t("views_home.homebody15") }}
              <br />
              {{ $t("views_home.homebody16") }}
            </div>
            <div class="community-screenshot">
              <img
                src="/assets/gettingStarted/launcher1_h320.jpg"
                alt="Screenshot main menu W3Champions start button"
              />
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- right col spanning both rows: social + support + partners -->
      <div class="bottom-sidebar">
        <social-box />
        <support-box />
        <partner-box />
      </div>

      <!-- left col row 2: map pool -->
      <v-card class="w3-plaque">
        <h2 class="banner px-4 pt-4">{{ $t("views_home.mappooltitle") }}</h2>
        <div class="ladderMaps">
          <div v-for="mode in activeGameModes" :key="mode.id">
            <div v-if="mode.id === 1 || mode.id === 2 || mode.id === 4">
              <div class="mode-header">
                <span class="mode w3-gray-gold-text">{{ mode.name }}</span>
                <copy-button :copyText="mapNamesAsString(mode.id)" tooltipText="maptooltip" />
              </div>
              <ul>
                <li v-for="map in mode.maps" :key="map.id">{{ map.name }}</li>
              </ul>
            </div>
          </div>
        </div>
        <br />
      </v-card>
    </div>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { marked } from "marked";
import { Ranking, ActiveGameMode } from "@/store/ranking/types";
import { getProfileUrl } from "@/helpers/url-functions";
import SocialBox from "@/components/common/SocialBox.vue";
import SupportBox from "@/components/common/SupportBox.vue";
import PartnerBox from "@/components/common/PartnerBox.vue";
import TopOngoingMatchesWithStreams from "@/components/matches/TopOngoingMatchesWithStreams.vue";
import { NewsMessage } from "@/store/admin/infoMessages/types";
import CopyButton from "@/components/common/CopyButton.vue";
import PageHero from "@/components/common/PageHero.vue";
import { EGameMode } from "@/store/types";
import { useInfoMessagesStore } from "@/store/admin/infoMessages/store";
import { useRankingStore } from "@/store/ranking/store";
import { useRouter } from "vue-router";
import { ESetupGuideRouteName, EMainRouteName } from "@/router/types";

export default defineComponent({
  name: "HomeView",
  components: {
    TopOngoingMatchesWithStreams,
    SocialBox,
    SupportBox,
    PartnerBox,
    CopyButton,
    PageHero,
  },
  setup() {
    const router = useRouter();
    const infoMessagesStore = useInfoMessagesStore();
    const rankingsStore = useRankingStore();
    const model = ref<number>(0);

    const topFive = computed<Ranking[]>(() => rankingsStore.topFive);
    const news = computed<NewsMessage[]>(() => infoMessagesStore.news);
    const currentSeasonId = computed<number | undefined>(() => rankingsStore.seasons[0]?.id);

    const activeGameModes = computed<ActiveGameMode[]>(() =>
      rankingsStore.activeModes.filter((mode) => mode.id === 1 || mode.id === 2 || mode.id === 4)
    );

    onMounted(async (): Promise<void> => {
      await rankingsStore.retrieveSeasons();
      rankingsStore.setSeason(rankingsStore.seasons[0]);
      await Promise.all([
        rankingsStore.getTopFive(),
        infoMessagesStore.loadNews(),
        rankingsStore.retrieveActiveGameModes(),
      ]);
    });

    function convertMarkdownToHTML(input: string): string | Promise<string> {
      return marked(input);
    }

    function goToSetupPage(): void {
      router.push({ name: ESetupGuideRouteName.LAUNCHER_SETUP });
    }

    function goToRankings(): void {
      router.push({ name: EMainRouteName.RANKINGS });
    }

    function goToProfile(rank: Ranking): void {
      router.push({ path: getProfileUrl(rank.player.playerIds[0].battleTag) });
    }

    function mapNamesAsString(gameMode: EGameMode): string {
      return activeGameModes.value
        .filter((mode) => mode.id === gameMode)
        .flatMap((mode) => mode.maps)
        .map((map) => map.name).join("\n");
    }

    return {
      goToSetupPage,
      goToRankings,
      model,
      news,
      convertMarkdownToHTML,
      activeGameModes,
      mapNamesAsString,
      topFive,
      goToProfile,
      currentSeasonId,
    };
  },
});
</script>

<style lang="scss" scoped>
// ── Hero grid ────────────────────────────────────────────────────────
.home-hero-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.hero-card {
  padding-bottom: 8px;
}

// ── Unified bottom grid (community + map pool left, sidebar right) ───
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 260px;
  grid-template-rows: auto auto;
  gap: 16px;
  align-items: start;

  // Left-col cards go in column 1, rows 1 and 2 automatically
  // Sidebar spans both rows in column 2
  > .bottom-sidebar {
    grid-column: 2;
    grid-row: 1 / 3;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;

    > .bottom-sidebar {
      grid-column: 1;
      grid-row: auto;
    }
  }
}

// ── Community inner layout (text + screenshot) ────────────────────────
.community-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: start;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

.community-screenshot {
  img {
    max-width: 240px;
    width: 100%;
    display: block;
    border-radius: 2px;
  }
}

// ── Download row ─────────────────────────────────────────────────────
.download-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 0 0 6px;
  flex-wrap: wrap;
}

// Gold button dot decorators
:deep(.join-button .v-btn__content) {
  gap: 14px;

  &::before, &::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff, #b08735 60%, #5b3f15);
    flex-shrink: 0;
  }
}

// ── Meta-line ─────────────────────────────────────────────────────────
.meta-line {
  font-family: var(--w3-font-mono);
  font-size: 11px;
  color: rgb(var(--v-theme-primary) / 0.45);
  letter-spacing: 0.14em;
  text-align: center;
  margin-bottom: 16px;
}

// ── Top ranks column (stacks topranks + live matches) ────────────────
.topranks-column {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.proto-rank-row {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 6px;
  border-bottom: 1px solid rgb(var(--v-theme-primary) / 0.15);
  cursor: pointer;
  transition: background 0.1s;

  &:last-of-type {
    border-bottom: 0;
  }

  &:hover {
    background: rgb(var(--v-theme-primary) / 0.06);
  }
}

.proto-pos {
  font-family: var(--w3-font-heading);
  color: rgb(var(--v-theme-w3-gold));
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  opacity: 0.7;

  &--gold {
    font-size: 20px;
    opacity: 1;
  }
}

.proto-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.proto-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), color-mix(in srgb, rgb(var(--v-theme-primary)) 60%, black));
  border: 1px solid rgb(var(--v-theme-w3-gold) / 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--w3-font-heading);
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-w3-gold));
  flex-shrink: 0;
}

.proto-name {
  font-family: var(--w3-font-heading);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.proto-wl {
  font-family: var(--w3-font-mono);
  font-size: 10px;
  color: rgb(var(--v-theme-primary) / 0.55);
  margin-top: 2px;
}

.proto-mmr {
  font-family: var(--w3-font-mono);
  font-size: 13px;
  color: rgb(var(--v-theme-w3-gold));
}

// ── News ──────────────────────────────────────────────────────────────
.news-date {
  font-size: 0.8rem !important;
  letter-spacing: 0.12em;
  opacity: 0.7;
}

:deep(.v-carousel) {
  .v-window__container {
    height: 350px;
    margin-bottom: 50px;
  }
  .v-window-item .v-responsive__content {
    overflow-y: auto;
  }
  .v-carousel__controls {
    background: rgba(0, 0, 0, 0.3);
  }
}

// ── Map pool ──────────────────────────────────────────────────────────
.ladderMaps {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  padding: 0 16px 8px;

  .mode-header {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }

  .mode {
    font-family: var(--w3-font-heading);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-right: 8px;
  }

  ul {
    margin-top: 4px;
    padding-left: 0;
  }

  li {
    list-style: none;
    font-family: var(--w3-font-body);
    font-size: 0.85rem;
    line-height: 1.8;
  }
}
</style>
