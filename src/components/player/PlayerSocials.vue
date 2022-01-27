<template>
  <v-row>
    <v-col cols="2" v-if="userProfile.twitch != ''" class="socialIcon">
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn
            icon
            v-on="on"
            :href="'http://twitch.tv/' + userProfile.twitch"
            target="_blank"
            class="twitchIcon"
          >
            <v-icon color="purple accent-4">mdi-twitch</v-icon>
          </v-btn>
        </template>
        <span>{{ userProfile.twitch }}</span>
      </v-tooltip>
    </v-col>
    <v-col cols="2" v-if="userProfile.youtube != ''" class="socialIcon">
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn
            icon
            v-on="on"
            :href="'http://youtube.com/' + userProfile.youtube"
            target="_blank"
          >
            <v-icon color="red darken-2">mdi-youtube</v-icon>
          </v-btn>
        </template>
        <span>{{ userProfile.youtube }}</span>
      </v-tooltip>
    </v-col>
    <v-col cols="2" v-if="userProfile.twitter != ''" class="socialIcon">
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn
            icon
            v-on="on"
            :href="'http://twitter.com/' + userProfile.twitter"
            target="_blank"
          >
            <v-icon color="blue darken-2">mdi-twitter</v-icon>
          </v-btn>
        </template>
        <span>{{ userProfile.twitter }}</span>
      </v-tooltip>
    </v-col>
    <v-col cols="2" v-if="!!userProfile.trovo" class="socialIcon">
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn
            icon
            v-on="on"
            :href="'https://trovo.live/' + userProfile.trovo"
            target="_blank"
          >
            <v-icon color="green darken-3">$trovo</v-icon>
          </v-btn>
        </template>
        <span>https://trovo.live/{{ userProfile.trovo }}</span>
      </v-tooltip>
    </v-col>
    <!-- THIS FEATURE IS WAITING ON BETTER ICONS - DO NOT USE UNTIL NEW ICONS -->
    <!-- <v-col cols="2" v-if="hasAnAlias && userProfile.aliasSettings.showW3info && w3infoId != 0" class="socialIcon">
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              icon
              v-on="on"
              :href="`https://warcraft3.info/stats/player/${w3infoId}`"
              target="_blank"
            >
              <v-icon color="light-green accent-3">$w3info</v-icon>
            </v-btn>
          </template>
          <span>{{ aliasOrW3infoId }}</span>
        </v-tooltip>
      </v-col>
      <v-col cols="2" v-if="hasAnAlias && userProfile.aliasSettings.showLiquipedia && liquipediaString != ''" class="socialIcon">
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              icon
              v-on="on"
              :href="`https://liquipedia.net/warcraft/${liquipediaString}`"
              target="_blank"
            >
              <v-icon>$liquipedia</v-icon>
            </v-btn>
          </template>
          <span>{{ liquipediaString }}</span>
        </v-tooltip>
      </v-col> -->
  </v-row>
</template>
<script lang="ts">
import Vue from "vue";
import { PlayerProfile } from "@/store/player/types";
import { Component, Prop } from "vue-property-decorator";

@Component
export default class PlayerSocials extends Vue {
  @Prop() public userProfile!: PlayerProfile;
}
</script>
