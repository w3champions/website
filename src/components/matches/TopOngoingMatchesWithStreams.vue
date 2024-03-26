<template>
  <v-card>
    <v-card-title>
      {{ $t("components_matches_topongoingmatcheswithstreams.toplive1v1matches") }}
    </v-card-title>
    <v-container>
      <v-row
        v-for="match in matchesSortedByMMR"
        :key="match.id"
        style="align-items: center"
      >
        <v-col cols="12">
          <streamed-match-info :match="match" />
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import orderBy from "lodash/orderBy";
import sumBy from "lodash/sumBy";
import { Component, Vue } from "vue-facing-decorator";
import { EGameMode, Match, PlayerInTeam } from "@/store/types";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import StreamedMatchInfo from "@/components/matches/StreamedMatchInfo.vue";
import { useTwitchStore } from "@/store/twitch/store";
import { useMatchStore } from "@/store/match/store";

@Component({
  components: { StreamedMatchInfo, TeamMatchInfo },
})
export default class TopOngoingMatchesWithStreams extends Vue {
  private matches: Match[] = [];
  private twitchStore = useTwitchStore();
  private matchStore = useMatchStore();

  async mounted() {
    await this.matchStore.loadAllOngoingMatches(EGameMode.GM_1ON1);

    const matchesWithStreamers =
      this.matchStore.allOngoingMatches.filter((match) =>
        match.teams.some((team) => team.players.some((player) => player.twitch))
      );
    const streamerNames = matchesWithStreamers.flatMap((match) =>
      match.teams.flatMap((team) => team.players.map((player) => player.twitch))
    );

    if (streamerNames.length > 0) {
      await this.twitchStore.getStreamStatus(streamerNames);

      const activeStreamers =
        this.twitchStore.twitchStreamResponse.data.map(
          (stream) => stream.user_name.toLowerCase()
        );

      this.matches = matchesWithStreamers
        .filter((match) =>
          match.teams.some((team) =>
            team.players.some((player) =>
              player.twitch
                ? activeStreamers.includes(player.twitch.toLowerCase())
                : false
            )
          )
        )
        .slice(0, 5);
    }
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
    return match.teams[index].players[0];
  }
}
</script>

<style lang="scss" scoped></style>
