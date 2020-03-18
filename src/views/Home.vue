<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="8">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Welcome</v-card-title>
              <v-card-text>This site is under construction.</v-card-text>
              <v-card-text>
                <p>If you want to test the latest version you have to setup W3Champions once on your pc. It automatically updates to its latest version. Follow these steps to set up everything:</p>
                <ol>
                  <li>
                    download the attached zip and unpack it directly into your Warcraft 3 folder (usually here C:\Program Files\Warcraft III).
                    Afterwards you should find the following file C:\Program Files\Warcraft III\webui\index.html in place. make sure that your unzip program did NOT create two webui folders (/webui/webui/index.html )
                  </li>
                  <li>start reforged as usual. You will find an additional button on the top of the versus screen to search for an opponent</li>
                  <li>keep in mind, this is a very early development stage. Things are not polished, it is no final product. Please let me know about all issues you face.</li>
                </ol>
                <br />You can find more informations in our
                <v-btn small text to="/Faq">FAQ section.</v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Lastest update</v-card-title>
              <v-card-text>
                <p>New update released. The following features are now available:</p>
                <ul>
                  <li>Find opponents in 1on1 (no MMR yet, just randomly putting together players)</li>
                  <li>Select race</li>
                  <li>record of wins and losses</li>
                  <li>profile page: http://profile.w3champions.com/#pad#22587</li>
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
                    <v-list-item-title v-text="rank.name"></v-list-item-title>
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
    window.open(`http://profile.w3champions.com/#${rank.name}`, "_blank");
  }
}
</script>
