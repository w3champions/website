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
import { computed, defineComponent, onMounted, ref } from "vue";
import orderBy from "lodash/orderBy";
import sumBy from "lodash/sumBy";
import { EGameMode, Match, PlayerInTeam } from "@/store/types";
import StreamedMatchInfo from "@/components/matches/StreamedMatchInfo.vue";
import { useTwitchStore } from "@/store/twitch/store";
import { useMatchStore } from "@/store/match/store";

export default defineComponent({
  name: "TopOngoingMatchesWithStreams",
  components: {
    StreamedMatchInfo,
  },
  setup() {
    const twitchStore = useTwitchStore();
    const matchStore = useMatchStore();
    const matches = ref<Match[]>([]);

    onMounted(async () => {
      await matchStore.loadAllOngoingMatches(EGameMode.GM_1ON1);

      const matchesWithStreamers =
        matchStore.allOngoingMatches.filter((match) =>
          match.teams.some((team) => team.players.some((player) => player.twitch))
        );
      const streamerNames = matchesWithStreamers.flatMap((match) =>
        match.teams.flatMap((team) => team.players.map((player) => player.twitch))
      );

      if (streamerNames.length > 0) {
        await twitchStore.getStreamStatus(streamerNames);

        const activeStreamers =
          twitchStore.twitchStreamResponse.data.map(
            (stream) => stream.user_name.toLowerCase()
          );

        matches.value = matchesWithStreamers
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
    });

    const matchesSortedByMMR = computed<Match[]>(() => {
      return orderBy(
        matches.value,
        (match) =>
          sumBy(
            match.teams.flatMap((team) =>
              team.players.map((player) => player.oldMmr)
            )
          ),
        ["desc"]
      );
    });

    const getPlayer = (match: Match, index: number): PlayerInTeam => match.teams[index].players[0];

    return {
      matchesSortedByMMR,
      getPlayer,
    };
  },
});
</script>
