<template>
  <v-data-table
    dense
    class="hide-footer"
    :options.sync="options"
    :server-items-length="totalMatches"
    :headers="headers"
    :items="matches"
    item-key="id"
    no-data-text="no matches found"
    :footer-props="{showFirstLastPage: true}"
  >
    <template v-slot:item.map="{ item }">
      <div class="mapPreview" :class="mapBackground(mapName(item))" />
      <span>
        {{ $t("mapNames." + mapName(item)) }}
      </span>
    </template>
    <template v-slot:item.startTime="{ item }">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <span v-on="on">{{ item.startTime | moment("MMM DD YYYY HH:mm") }}</span>
          <br />
          <span v-if="Object.prototype.hasOwnProperty.call(item.players[0], 'won')">
            completed
          </span>
          <span v-else>
            ongoing
          </span>
        </template>
        <span>Id: {{ item.id }}</span>
      </v-tooltip>
    </template>
    <template v-slot:item.players="{ item }">
      <v-row>
        <v-col v-if="!onlyShowEnemy" cols="5">
          <player-match-info :player="getWinner(item)" left="true"></player-match-info>
        </v-col>
        <v-col v-if="!onlyShowEnemy">VS</v-col>
        <v-col :cols="!onlyShowEnemy ? 5 : 6">
          <player-match-info :player="getLoser(item)" :left="onlyShowEnemy"></player-match-info>
        </v-col>
      </v-row>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { Match } from "../store/typings";
import PlayerMatchInfo from "./PlayerMatchInfo.vue";

@Component({
  components: {
    PlayerMatchInfo
  }
})
export default class MatchesGrid extends Vue {
  @Prop() public value!: Match[];
  @Prop() public totalMatches!: number;
  @Prop() public itemsPerPage!: number;
  @Prop() public alwaysLeftName!: string;
  @Prop() public onlyShowEnemy!: boolean;

  get matches(): Match[] {
    return this.value;
  }

  public options: any = {
    itemsPerPage: 100
  };

  mapBackground(item: any) {
    return "mapPreview-" + item;
  }

  mapName(item: any) {
    const meinString = item.map.substr(item.map.lastIndexOf('/') + 1)
            .replace('.w3x', '')
            .replace('(2)', '')
            .replace('(4)', '')
            .replace('_lv', '');
    return meinString;
  }

  @Watch("options", { deep: true })
  public onOptionsChanged() {
    this.$emit("pageChanged", this.options.page);
  }

  public getWinner(match: Match) {
    if (this.alwaysLeftName) {
      const players = match.players.filter(
        x => x.battleTag.toLowerCase() === this.alwaysLeftName.toLowerCase()
      );

      if (players && players.length > 0) {
        return players[0];
      }
    }

    const winner = match.players.filter(x => x.won === true);

    if (winner && winner.length > 0) {
      return winner[0];
    }

    return match.players[0];
  }

  public getLoser(match: Match) {
    if (this.alwaysLeftName) {
      const players = match.players.filter(
        x => x.battleTag.toLowerCase() !== this.alwaysLeftName.toLowerCase()
      );

      if (players && players.length > 0) {
        return players[0];
      }
    }

    const loser = match.players.filter(x => x.won === false);

    if (loser && loser.length > 0) {
      return loser[0];
    }

    return match.players[1];
  }

  mounted() {
    this.options.itemsPerPage = this.itemsPerPage;
  }

  public headers = [
    {
      text: "Players",
      align: "center",
      sortable: false,
      value: "players",
      width: "600px"
    },
    {
      text: "Map",
      align: "start",
      sortable: false,
      value: "map"
    },
    {
      text: "Start Time",
      align: "start",
      sortable: false,
      value: "startTime",
      width: "180px"
    }
  ];
}
</script>

<style lang="scss" scoped>
.playerCol {
  max-width: 500px;
}

.mapPreview {
  float: left;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  margin-right: 30px;
  width: 42px;
  height: 42px;
  border: solid 1.5px #909090;
}

.mapPreview-twistedmeadows {
  background-image: url("../assets/mapIcons/twistedmeadows.png");
}

.mapPreview-amazonia {
  background-image: url("../assets/mapIcons/amazonia.png");
}

.mapPreview-concealedhill {
  background-image: url("../assets/mapIcons/concealedhill.png");
}

.mapPreview-echoisles {
  background-image: url("../assets/mapIcons/echoisles.png");
}

.mapPreview-lastrefuge {
  background-image: url("../assets/mapIcons/lastrefuge.png");
}

.mapPreview-northernisles {
  background-image: url("../assets/mapIcons/northernisles.png");
}

.mapPreview-northernisles {
  background-image: url("../assets/mapIcons/northernisles.png");
}

.mapPreview-terenasstand {
  background-image: url("../assets/mapIcons/terenasstand.png");
}
</style>
