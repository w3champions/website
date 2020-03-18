<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="8">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Welcome</v-card-title>

<v-row>
<v-col cols="6">
              <v-card-text>
                <h3>It is finally there - your Ladder for Warcraft III</h3>
                <div>
                  Finally your Warcraft III 1on1 Ladder is available, crafted by and for the community!
                  <br><br>
                  The ladder contains:
  <ul>
    <li>Improved Pings by non-global ladder</li>
    <li>Matchmaking (based on W3Arena)</li>
    <li>Ladder System (Check the RANKINGS tab top right)</li>
    <li>Seamless integration in your Warcraft III client</li>
    <li>Profiles</li>
    <li>Differen Mappool</li>
  </ul>


<div>
  <br/>
                  <b>Current Map Pool</b><br>
                    TM,EI,TSLV,CH,NIS,AZ and LR
                    </div>
                </div>
              </v-card-text>
              </v-col>
              <v-col cols="6">
                <img src="../assets/reforged.png" style="width: 90%">
              </v-col>
</v-row>

              <v-row>
                <v-col cols="6">
                  <v-card-text>
                    <h3>Installation Guide Windows</h3>
                    <p>We created a setup tool that automatically does all steps needed.</p>
                    <v-btn
                      color="primary"
                      href="./w3champions-setup.exe"
                      target="_blank"
                      value
                    >Download the Windows installer</v-btn>
                                        <br/><br/>
                    <p>
                      <ol>
                        <li>
                      Download the installer, execute it and select your Warcraft III installation folder.
                     </li>
                      <li>
                       You are ready to go. Start Warcraft III and you should see the new button in the Versus-screen.
                     </li>
                    </ol>
                    </p>
                  </v-card-text>
                </v-col>
                <v-col cols="6">
                  <v-card-text>
                    <h3>Installation Guide Mac OS</h3>
                    <p>With a Mac you have to place the following files in your WC3 Installation folder manually.</p>
                    <v-btn
                      color="primary"
                      href="./w3champions-setup.exe"
                      target="_blank"
                    >Download the Mac archive</v-btn>
                    <br/><br/>
                    <p>
                      <ol>
                        <li>
                      Download the archive file and unpack it in your Warcraft Installation folder
                     </li>
                     <li>
                      Make sure to have a directory structure like Warcraft III\webui\index.html
                     </li>
                      <li>
                       You are ready to go. Start Warcraft III and you should see the new button in the Versus-screen.
                     </li>
                    </ol>
                    </p>
                  </v-card-text>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" style="display:none">
            <v-card>
              <v-card-title>Lastest update</v-card-title>
              <v-card-text>
                <p>New update released. The following features are now available:</p>
                <ul>
                  <li>Find opponents in 1on1 (no MMR yet, just randomly putting together players)</li>
                  <li>Select race</li>
                  <li>record of wins and losses</li>
                  <li>profile page: http://profile.w3champions.com/</li>
                </ul>
              </v-card-text>
              <v-card-text>
                <p>
                  If you like give it a try yourself, check out #setup-guide. Testing and feedback are highly appreciated.
                  Missing features:
                </p>
                <ul>
                  <li>multiple maps</li>
                  <li>map vetos</li>
                  <li>MMR</li>
                  <li>Ladder</li>
                </ul>I assume this can be archived until the end of the week - depending on how much spare time i can invest this week.
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" md="4">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Community</v-card-title>
              <v-card-text>
                <ul>
                  <li>
                    <a
                      href="https://discordapp.com/invite/uJmQxG2"
                      target="blank"
                    >Join us on discord</a>
                  </li>
                  <li>
                    <a href="https://twitter.com/W3Pad" target="blank">Follow @W3Pad on twitter</a>
                  </li>
                  <li>
                    <a href="https://www.patreon.com/w3pad" target="blank">Support us on patreon</a>
                  </li>
                  <li>
                    <a
                      href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=MT3PNN6W44AYN&source=url"
                      target="blank"
                    >Or directly support us via PayPal</a>
                  </li>
                </ul>
              </v-card-text>
              <v-card-text></v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Top Ranks</v-card-title>
              <v-list dense>
                <v-list-item v-for="(rank, i) in topFive" :key="i" @click="goToProfile(rank)">
                  <v-list-item-icon>{{i + 1}}.</v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title v-text="rank.battleTag"></v-list-item-title>
                    <v-list-item-subtitle>Win/Loss/Total: {{rank.wins}}/{{rank.losses}}/{{rank.wins + rank.losses}}</v-list-item-subtitle>
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
import { Ranking } from "../store/ranking/types";

@Component({})
export default class HomeView extends Vue {
  get topFive(): Ranking[] {
    return this.$store.direct.state.rankings.topFive;
  }

  mounted() {
    this.$store.direct.dispatch.rankings.getTopFive();
  }

  public goToProfile(rank: Ranking) {
    window.open(`http://profile.w3champions.com/#${rank.battleTag}`, "_blank");
  }
}
</script>
