<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="8">
        <v-card tile>
          <v-card-text>
            <v-card-title v-if="newsContent !== ''">News {{ newsDate }}</v-card-title>
            <v-row>
              <v-col>
                <vue-markdown v-if="newsContent !== ''">
                  {{ newsContent }}
                </vue-markdown>
              </v-col>
            </v-row>
          </v-card-text>
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

          <v-card-text>
            <v-row>
              <v-col cols="6" md="6">
                <h3>Installation Guide Windows</h3>
                <p>
                  We created a setup tool that automatically does all steps
                  needed.
                </p>
                <v-btn
                  color="primary"
                  href="./W3Champions.msi"
                  target="_blank"
                  value
                  outlined
                  class="w3-background"
                >
                  <v-icon>mdi-download</v-icon>
                  <span class="mr-2 hidden-xs-only">Windows launcher</span>
                </v-btn>
              </v-col>
              <v-col cols="6" md="6">
                <h3>Installation Guide Mac OS / Manual installation</h3>
                <p>
                  If you are using a MAC or you are having trouble with the launcher
                  you can install W3Champions manually.
                </p>
                <ol>
                  <li>
                    Download the archive file and unpack it in your Warcraft
                    Installation folder
                  </li>
                  <v-btn
                    class="w3-background ma-4"
                    color="primary"
                    href="./MAC-W3Champions.zip"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">Mac Archive</span>
                  </v-btn>
                  <li>
                    Make sure to have a directory structure like Warcraft
                    III\webui\index.html
                  </li>
                  <li>
                    Download the Maps Archive and unpack it to your Warcraft III Maps Folder
                  </li>
                  <v-btn
                    class="w3-background ma-4"
                    color="primary"
                    href="./W3Champions-Maps-V1.zip"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">Download MAPS archive</span>
                  </v-btn>
                  <li>
                    The folder structure after unpacking should be Maps/W3Champions/v1/FFA
                  </li>
                </ol>
              </v-col>
            </v-row>
            <br />
            <div class="filter-blur text-center mt-5">
              <h3>
                If you are having trouble with the launcher. You can use this
                video to manually install W3C.
              </h3>
              <p>
                The video is shot on Windows but it should work for other operating systems as well.
              </p>

            <iframe width="560" height="315" src="https://www.youtube.com/embed/l1aRcUL7qEc" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
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
                        <span style="font-size: 15px">{{ i + 1 }}.</span>
                      </v-col>
                      <v-col cols="10">
                        {{rank.player.name}}
                        <div style="font-size: 11px">
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

    const mdNewsResponse = await fetch("./news.md");
    const mdNews = await mdNewsResponse.text();
    this.newsContent = mdNews;

    const mdNewsDateResponse = await fetch("./news-date.md");
    const mdNewsDate = await mdNewsDateResponse.text();
    this.newsDate = mdNewsDate;
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
