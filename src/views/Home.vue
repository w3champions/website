<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="8">
        <v-card tile>
          <v-card-text>
            <v-row class="justify-center">
              <v-col>
                <v-card-title v-if="newsContent !== ''">
                  News {{ newsDate }}
                </v-card-title>
                <vue-markdown v-if="newsContent !== ''">
                  {{ newsContent }}
                </vue-markdown>
              </v-col>
            </v-row>
          </v-card-text>
          <v-row class="justify-center">
            <v-col class="text-center mb-10">
              <v-btn @click="goToSetupPage" class="join-button">Join the Battlefield now!</v-btn>
            </v-col>
          </v-row>
          <v-card-title>Come and join us!</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                Finally your Warcraft III 1on1 Ladder is available, crafted by
                and for the community!
                <br />
                <br />
                The ladder contains:
                <ul>
                  <li>Improved Pings by non-global ladder</li>
                  <li>Matchmaking (based on W3Arena)</li>
                  <li>Ladder System (Check the RANKINGS tab top right)</li>
                  <li>Seamless integration in your Warcraft III client</li>
                  <li>Profiles</li>
                  <li>Different Mappool</li>
                </ul>
                <br />
                <b>Current Map Pool</b>
                <br />
                TM,EI,TSLV,CH,NIS,AZ and LR
              </v-col>
              <v-col cols="12" md="6">
                <img
                  src="../assets/reforged.jpg"
                  style="max-width: 90%; max-height: 320px;"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-row>
          <v-col cols="12" class="no-padding">
            <v-card tile>
              <v-card-title>Community</v-card-title>
              <v-card-text class="filter-blur">
                Join us
                <br />
                <a href="https://discord.gg/uJmQxG2" target="_blank">
                  <img
                    src="../assets/discord-small.png"
                    style="margin-left: -8px;"
                    height="50px"
                  />
                </a>
                <br />
                Social Media
                <br />
                <a href="https://twitter.com/W3Pad" target="_blank">
                  <img src="../assets/twitter.svg" height="24" />
                </a>
                <br />
                Support us
                <br />
                <a href="https://www.patreon.com/w3pad" target="_blank">
                  <img src="../assets/patreon.png" height="24" />
                </a>
                <br />
                <div style="margin-top: 5px;">
                  <a
                    style="margin-top: 15px;"
                    href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=MT3PNN6W44AYN&source=url"
                    target="_blank"
                  >
                    <img src="../assets/paypal.png" height="24" />
                  </a>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class>
            <v-card tile>
              <v-card-title>Top Ranks</v-card-title>
              <table class="custom-table" dense>
                <tr
                  v-for="(rank, i) in topFive"
                  :key="i"
                  @click="goToProfile(rank)"
                >
                  <td>
                    <v-row class="justify-space-between">
                      <v-col cols="2">
                        <span style="font-size: 15px;">{{ i + 1 }}.</span>
                      </v-col>
                      <v-col cols="10">
                        {{ rank.player.name }}
                        <div style="font-size: 11px;">
                          Win/Loss/Total: {{ rank.player.wins }}/{{
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
import { API_URL } from "@/main";

@Component({ components: { VueMarkdown } })
export default class HomeView extends Vue {
  public newsContent = "";
  public newsDate = "";

  get topFive(): Ranking[] {
    return this.$store.direct.state.rankings.topFive;
  }

  async mounted() {
    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    await this.$store.direct.dispatch.rankings.getTopFive();

    if (API_URL.includes("test")) {
      await this.setNewsContent("test");
    } else {
      await this.setNewsContent("prod");
    }
  }

  public goToSetupPage() {
    this.$router.push({
      path: "/getting-started/"
    });
  }

  private async setNewsContent(stage: string) {
    const mdNewsResponse = await fetch(
      `https://raw.githubusercontent.com/modmoto/w3champions-news/master/${stage}/news.md`
    );
    this.newsContent = await mdNewsResponse.text();

    const mdNewsDateResponse = await fetch(
      `https://raw.githubusercontent.com/modmoto/w3champions-news/master/${stage}/news-date.md`
    );
    this.newsDate = await mdNewsDateResponse.text();
  }

  public goToProfile(rank: Ranking) {
    this.$router.push({
      path: "/player/" + encodeURIComponent(rank.player.playerIds[0].battleTag),
    });
  }
}
</script>

<style lang="scss" scoped>
.no-padding {
  padding-top: 0;
}
</style>
