<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8">
        <v-card tile>
          <br />
          <v-card-title class="justify-center">
            {{ $t("views_home.w3c_motto") }}
          </v-card-title>
          <v-row class="justify-center">
            <v-col class="text-center">
              <v-btn
                height="76px"
                @click="goToSetupPage"
                class="join-button my-7 px-11"
              >
                {{ $t("views_home.join_button") }}
              </v-btn>
            </v-col>
          </v-row>
          <v-card-text>
            <v-carousel
              v-model="model"
              :show-arrows="false"
              :dark="$vuetify.theme.dark"
              :light="!$vuetify.theme.dark"
              height="350px"
            >
              <v-carousel-item v-for="newsItem in news.slice(0,8)" :key="newsItem.date">
                <v-card-title>
                  {{ newsItem.date }}
                </v-card-title>
                <div v-html="convertMarkdownToHTML(newsItem.message)"></div>
              </v-carousel-item>
            </v-carousel>
          </v-card-text>
          <v-card-title>{{ $t("views_home.hometitle") }}</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                {{ $t("views_home.homebody1") }}
                <br />
                <br />
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
                <br />
                <br />
              </v-col>
              <v-col cols="12" md="6">
                <img
                  src="../assets/gettingStarted/startButton_preview_h320.jpg"
                  style="max-width: 90%; max-height: 320px"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-title>{{ $t("views_home.mappooltitle") }}</v-card-title>
          <div class="seasonMaps">
            <div>
              <b class="mode">{{ $t("gameModes.GM_1ON1") }}</b>
              <copy-button :copyText="mapNamesAsString('1vs1')" tooltipText="maptooltip"></copy-button>
              <ul><li v-for="map in maps1v1" :key="map.id">{{ map.name }}</li></ul>
            </div>
            <div>
              <b class="mode">{{ $t("gameModes.GM_2ON2") }}</b>
              <copy-button :copyText="mapNamesAsString('2vs2')" tooltipText="maptooltip"></copy-button>
              <ul><li v-for="map in maps2v2" :key="map.id">{{ map.name }}</li></ul>
            </div>
            <div>
              <b class="mode">{{ $t("gameModes.GM_4ON4") }}</b>
              <copy-button :copyText="mapNamesAsString('4vs4')" tooltipText="maptooltip"></copy-button>
              <ul><li v-for="map in maps4v4" :key="map.id">{{ map.name }}</li></ul>
            </div>
          </div>
          <br />
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-row>
          <v-col cols="12" class="no-padding">
            <social-box />
            <support-box />
            <partner-box />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <top-ongoing-matches-with-streams />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card tile>
              <v-card-title>{{ $t("views_home.topranks") }}</v-card-title>
              <table class="custom-table" dense>
                <tr
                  v-for="(rank, i) in topFive"
                  :key="i"
                  @click="goToProfile(rank)"
                >
                  <td>
                    <v-row class="justify-space-between">
                      <v-col cols="2">
                        <span style="font-size: 15px">{{ i + 1 }}.</span>
                      </v-col>
                      <v-col cols="10">
                        {{ rank.player.name }}
                        <div style="font-size: 11px">
                          {{ $t("views_home.wlt") }}: {{ rank.player.wins }}/{{
                            rank.player.losses
                          }}/{{ rank.player.games }}
                        </div>
                      </v-col>
                    </v-row>
                  </td>
                </tr>
              </table>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { marked } from "marked";
import { Ranking } from "@/store/ranking/types";
import { getProfileUrl } from "@/helpers/url-functions";
import SocialBox from "@/components/common/SocialBox.vue";
import SupportBox from "@/components/common/SupportBox.vue";
import PartnerBox from "@/components/common/PartnerBox.vue";
import TopOngoingMatchesWithStreams from "@/components/matches/TopOngoingMatchesWithStreams.vue";
import { NewsMessage } from "@/store/admin/infoMessages/types";
import { Map } from "@/store/admin/mapsManagement/types";
import CopyButton from "@/components/common/CopyButton.vue";
import { EGameMode } from "@/store/types";
import { useInfoMessagesStore } from "@/store/admin/infoMessages/store";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import { useRankingStore } from "@/store/ranking/store";

@Component({
  components: {
    TopOngoingMatchesWithStreams,
    SocialBox,
    SupportBox,
    PartnerBox,
    CopyButton,
  },
})
export default class HomeView extends Vue {
  public model = 0;
  maps1v1: Map[] = [];
  maps2v2: Map[] = [];
  maps4v4: Map[] = [];
  private infoMessagesStore = useInfoMessagesStore();
  private mapsManagementStore = useMapsManagementStore();
  private rankingsStore = useRankingStore();

  get topFive(): Ranking[] {
    return this.rankingsStore.topFive;
  }

  get news(): NewsMessage[] {
    return this.infoMessagesStore.news;
  }

  async mounted(): Promise<void> {
    await this.rankingsStore.retrieveSeasons();
    this.rankingsStore.setSeason(this.rankingsStore.seasons[0]);
    await this.rankingsStore.getTopFive();
    await this.infoMessagesStore.loadNews();
    await this.mapsManagementStore.loadMapsForCurrentSeason();
    this.maps1v1 = this.mapsManagementStore.seasonMaps.filter((m) => m.id === EGameMode.GM_1ON1)[0].maps;
    this.maps2v2 = this.mapsManagementStore.seasonMaps.filter((m) => m.id === EGameMode.GM_2ON2)[0].maps;
    this.maps4v4 = this.mapsManagementStore.seasonMaps.filter((m) => m.id == EGameMode.GM_4ON4)[0].maps;
  }

  public convertMarkdownToHTML(input: string): string {
    return marked(input);
  }

  public goToSetupPage(): void {
    this.$router.push({
      path: "/getting-started/",
    });
  }

  public goToProfile(rank: Ranking): void {
    this.$router.push({
      path: getProfileUrl(rank.player.playerIds[0].battleTag),
    });
  }

  public mapNamesAsString(mode: string) {
    switch (mode) {
      case "1vs1":
        return this.maps1v1.map((m) => m.name).join("\n");
      case "2vs2":
        return this.maps2v2.map((m) => m.name).join("\n");
      case "4vs4":
        return this.maps4v4.map((m) => m.name).join("\n");
    }
  }
}
</script>

<style lang="scss" scoped>
.no-padding {
  padding-top: 0;
}

.v-btn.join-button {
  letter-spacing: 0 !important;
  font-family: inherit !important;
  font-size: 20px;
}

.seasonMaps {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;

  ul {
    margin-top: 10px;
    padding-left: 0;
  }

  li {
    list-style: none;
  }

  .mode {
    margin-right: 15px;
  }
}
</style>
