<template>
  <v-container fluid>
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
                <b>{{ $t("views_home.mappooltitle") }}</b>
                <br />
                {{ $t("views_home.mappoolbody") }}
              </v-col>
              <v-col cols="12" md="6">
                <img
                  src="../assets/w3championsScreenshot.png"
                  style="max-width: 90%; max-height: 320px"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-row>
          <v-col cols="12" class="no-padding">
            <social-box></social-box>
            <support-box></support-box>
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
import TopOngoingMatchesWithStreams from "@/components/matches/TopOngoingMatchesWithStreams.vue";

@Component({
  components: {
    TopOngoingMatchesWithStreams,
    VueMarkdown,
    SocialBox,
    SupportBox,
  },
})
export default class HomeView extends Vue {
  public model = 0;

  get topFive(): Ranking[] {
    return this.$store.direct.state.rankings.topFive;
  }

  get news() {
    return this.$store.direct.state.admin.news;
  }

  async mounted() {
    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    await this.$store.direct.dispatch.rankings.getTopFive();
    await this.$store.direct.dispatch.admin.loadNews();
  }

  public goToSetupPage() {
    this.$router.push({
      path: "/getting-started/",
    });
  }

  public goToProfile(rank: Ranking) {
    this.$router.push({
      path: getProfileUrl(rank.player.playerIds[0].battleTag),
    });
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
</style>
