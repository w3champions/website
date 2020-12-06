<template>
  <v-card>
    <v-card-title>Top 5 matches live</v-card-title>
    <v-container>
      <v-row v-for="match in matchesSortedByMMR" :key="match.id" style="align-items: center">
        <v-col cols="5">
          <streamed-match-info :player="getPlayer(match, 0)" />
        </v-col>

        <v-col cols="2">VS</v-col>

        <v-col cols="5">
          <streamed-match-info :player="getPlayer(match, 1)" :is-right-aligned="true" />
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import orderBy from "lodash/orderBy";
import sumBy from "lodash/sumBy";
import { Component } from "vue-property-decorator";
import { EGameMode, Match, PlayerInTeam } from "@/store/typings";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import StreamedMatchInfo from "@/components/matches/StreamedMatchInfo.vue";

@Component({
  components: { StreamedMatchInfo, TeamMatchInfo },
})
export default class TopOngoingMatchesWithStreams extends Vue {
  private matches: Match[] = [];

  async mounted() {
    await this.$store.direct.dispatch.matches.loadAllOngoingMatches(
      EGameMode.GM_1ON1
    );

    const matchesWithStreamers = this.$store.direct.state.matches.allOngoingMatches.filter(
      (match) =>
        match.teams.some((team) => team.players.some((player) => player.twitch))
    );
    const streamerNames = matchesWithStreamers
      .flatMap((match) =>
        match.teams.flatMap((team) =>
          team.players.map((player) => player.twitch)
        )
      )
      .filter(Boolean);

    if (streamerNames.length > 0) {
      await this.$store.direct.dispatch.twitch.getStreamStatus(streamerNames as string[]);
    }

    const activeStreamers = this.$store.direct.state.twitch.twitchStreamResponse.data.map(
      (stream) => stream.user_name.toLowerCase()
    );

    this.matches = matchesWithStreamers.filter((match) =>
      match.teams.some((team) =>
        team.players.some((player) =>
          player.twitch
            ? activeStreamers.includes(player.twitch.toLowerCase())
            : false
        )
      )
    ).slice(0,5);
  }

  get matchesSortedByMMR(): Match[] {
    return orderBy(
      this.matches,
      (match) =>
        sumBy(
          match.teams.flatMap((team) =>
            team.players.map((player) => player.oldMmr)
          )
        ),
      ["desc"]
    );
  }

  public getPlayer(match: Match, index: number): PlayerInTeam {
    return match.teams[index].players[0]
  }
}
</script>

<style lang="scss" scoped></style>
