<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="8">
        <v-card tile>
          <v-card-title>It is finally there</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                Finally your Warcraft III 1on1 Ladder is available, crafted by
                and for the community!
                <br />
                <br />The ladder contains:
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
                <br />TM,EI,TSLV,CH,NIS,AZ and LR
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
                <ol>
                  <li>
                    Download the installer, execute it and select your Warcraft
                    III installation folder.
                  </li>
                  <li>
                    You are ready to go. Start Warcraft III and you should see
                    the new button in the Versus-screen.
                  </li>
                </ol>
              </v-col>
              <v-col cols="6" md="6">
                <h3>Installation Guide Mac OS</h3>
                <p>
                  With a Mac you have to place the following files in your WC3
                  Installation folder manually.
                </p>
                <ol>
                  <li>
                    Download the archive file and unpack it in your Warcraft
                    Installation folder
                  </li>
                  <li>
                    Make sure to have a directory structure like Warcraft
                    III\webui\index.html
                  </li>
                  <li>
                    You are ready to go. Start Warcraft III and you should see
                    the new button in the Versus-screen.
                  </li>
                </ol>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <p>
                  <v-btn
                    color="primary"
                    href="./w3champions-setup.exe"
                    target="_blank"
                    value
                    outlined
                    class="w3-background"
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">Windows installer</span>
                  </v-btn>
                </p>
                <p>
                  <b>Issues with the download link?</b>
                  <br />Some Antivir-Software has falsely detected our setup as
                  malicious. We contacted them and some already corrected their
                  databases. If thats not the case for you, use the following
                  link and unpack the setup with the
                  <b style="white-space: nowrap;">password WC3</b>
                </p>
                <p>
                  <v-btn
                    class="w3-background"
                    color="secondary"
                    href="./w3champions-setup.zip"
                    target="_blank"
                    value
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only"
                      >Windows installer zipped</span
                    >
                  </v-btn>
                </p>
              </v-col>
              <v-col cols="6">
                <p>
                  <v-btn
                    class="w3-background"
                    color="primary"
                    href="./webui.zip"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">Mac archive</span>
                  </v-btn>
                </p>
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
                <br />Social Media
                <br />
                <a href="https://twitter.com/W3Pad" target="_blank">
                  <img src="../assets/twitter.svg" height="24" />
                </a>
                <br />Support us
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
              <v-list dense>
                <v-list-item
                  v-for="(rank, i) in topFive"
                  :key="i"
                  @click="goToProfile(rank)"
                >
                  <v-list-item-icon>{{ i + 1 }}.</v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title
                      v-text="rank.player.name"
                    ></v-list-item-title>
                    <v-list-item-subtitle
                      >Win/Loss/Total: {{ rank.player.wins }}/{{
                        rank.player.losses
                      }}/{{ rank.player.games }}</v-list-item-subtitle
                    >
                  </v-list-item-content>
                </v-list-item>
              </v-list>
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

@Component({})
export default class HomeView extends Vue {
  get topFive(): Ranking[] {
    return this.$store.direct.state.rankings.topFive;
  }

  async mounted() {
    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    await this.$store.direct.dispatch.rankings.getTopFive();
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
