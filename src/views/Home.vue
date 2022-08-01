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
              <button @click="goToSetupPage" class="join-button">
                {{ $t("views_home.join_button") }}
              </button>
            </v-col>
          </v-row>
          <v-card-text>
            <v-carousel
              v-model="model"
              :show-arrows="false"
              :dark="$vuetify.theme.dark"
              :light="!$vuetify.theme.dark"
            >
              <v-carousel-item v-for="newsItem in news" :key="newsItem.date">
                <v-card-title>
                  {{ newsItem.date }}
                </v-card-title>
                <vue-markdown>
                  {{ newsItem.message }}
                </vue-markdown>
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
import { Ranking } from "@/store/ranking/types";
import VueMarkdown from "vue-markdown";
import { getProfileUrl } from "@/helpers/url-functions";
import SocialBox from "@/components/common/SocialBox.vue";
import SupportBox from "@/components/common/SupportBox.vue";
import PartnerBox from "@/components/common/PartnerBox.vue";
import TopOngoingMatchesWithStreams from "@/components/matches/TopOngoingMatchesWithStreams.vue";
import { NewsMessage } from "@/store/admin/messages/types";
import { Map } from "@/store/admin/maps/types"
import CopyButton from "@/components/common/CopyButton.vue";

@Component({
  components: {
    TopOngoingMatchesWithStreams,
    VueMarkdown,
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

  get topFive(): Ranking[] {
    return this.$store.direct.state.rankings.topFive;
  }

  get news(): NewsMessage[] {
    return this.$store.direct.state.infoMessages.news;
  }

  async mounted(): Promise<void> {
    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    await this.$store.direct.dispatch.rankings.getTopFive();
    await this.$store.direct.dispatch.infoMessages.loadNews();
    await this.$store.direct.dispatch.admin.mapsManagement.loadMapsForCurrentSeason();
    this.maps1v1 = this.$store.direct.state.admin.mapsManagement.seasonMaps.filter((m) => m.gameMode == "1vs1")[0].maps;
    this.maps2v2 = this.$store.direct.state.admin.mapsManagement.seasonMaps.filter((m) => m.gameMode == "2vs2")[0].maps;
    this.maps4v4 = this.$store.direct.state.admin.mapsManagement.seasonMaps.filter((m) => m.gameMode == "4vs4")[0].maps;
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

.join-button {
  cursor: pointer;
  line-height: 1;
  background-color: transparent;
  text-transform: uppercase;
  color: rgb(51, 38, 28);
  background-image: linear-gradient(rgba(255, 255, 0, 0.2) 50%, transparent 50%),
    linear-gradient(rgb(255, 209, 85), rgb(220, 166, 13));
  box-shadow: rgba(0, 0, 0, 0.8) 0px 0px 0px 2px,
    rgba(236, 174, 6, 0.3) 0px 0px 40px 15px,
    rgba(255, 255, 255, 0.4) 0px 0px 0px 2px inset,
    rgba(255, 125, 19, 0.3) 0px 0px 20px 10px inset;
  text-shadow: rgb(51, 38, 28) 0px 0px;
  height: 76px;
  margin-top: 26px;
  margin-bottom: 26px;
  font-size: 20px;
  border-width: 0px;
  border-style: initial;
  border-color: initial;
  border-image: initial;
  border-radius: 2px;
  background-repeat: no-repeat;
  outline: 0px;
  text-decoration: none;
  transition: filter 200ms ease 0s;
  padding: 0px 45px;
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
