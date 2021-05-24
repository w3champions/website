<template>
  <div class="bracket-match" v-bind:style="`height: ${cellHeight * 2}px;`">
    <div class="match-part match-top">
      <div class="match-date" v-if="date">{{ formatDate() }}</div>
      <div v-bind:class="getClass(topPlayer, 0)">
        <div class="match-player-name">
          <div class="country-flag__container">
            <country-flag-extended
              class="country-flag"
              :location="topPlayer.countryCode"
              size="small"
            />
          </div>
          <span style="vertical-align: -1px; padding-left:6px">{{ topPlayer.name }}</span>
        </div>
        <div class="match-score" style="width: 21px;">{{ topPlayer.score }}</div>
      </div>
    </div>
    <div class="match-part match-bottom">
      <div v-bind:class="getClass(bottomPlayer, 1)">
        <div class="match-player-name">
          <div class="country-flag__container">
            <country-flag-extended
              class="country-flag"
              :location="bottomPlayer.countryCode"
              size="small"
            />
          </div>
          <span style="vertical-align: -1px; padding-left:6px">{{ bottomPlayer.name }}</span>
        </div>
        <div class="match-score" style="width: 21px;">{{ bottomPlayer.score }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import moment from "moment";
import {
  ITournamentPlayer} from "@/store/tournaments/types";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { ERaceEnum } from "@/store/typings";

@Component({
  components: {
    CountryFlagExtended
  }
})
export default class TournamentMatch extends Vue {
  @Prop() topPlayer!: ITournamentPlayer;
  @Prop() bottomPlayer!: ITournamentPlayer;
  @Prop() date!: string;
  @Prop() cellHeight!: number;

  getClass(player: ITournamentPlayer, index: number) {
    return {
      "match-player-top": index == 0,
      "match-player-bottom": index == 1,
      "match-human": player.race == ERaceEnum.HUMAN,
      "match-orc": player.race == ERaceEnum.ORC,
      "match-ud": player.race == ERaceEnum.UNDEAD,
      "match-elf": player.race == ERaceEnum.NIGHT_ELF
    };
  }

  formatDate() {
    return moment(this.date).format(
      this.$t("dateFormats.dateTime").toString()
    )
  }
}
</script>

<style lang="scss" scoped>
.match-top,
.match-bottom {
  height: 50%;
  display: grid;
  justify-items: end;
  grid-auto-flow: row;
}

.match-top {
  align-content: end;
}

.match-bottom {
  align-content: start;
}

.match-date,
.match-player-top,
.match-player-bottom {
  box-sizing: border-box;
  width: 100%;
  display: block;
}

.match-date {
  text-align: center;
  background: #ebebeb;
  border: 1px solid #aaaaaa;
}

.match-player-top,
.match-player-bottom {
  border: solid #aaaaaa 1px;
  min-height: 20px;
  line-height: 18px;
  background: #f2f2f2;
  display: grid;
  grid-template-columns: auto 21px;
  grid-auto-flow: column;
}

.match-player-top {
  border-radius: 2px 2px 0 0;
}

.match-player-bottom {
  border-radius: 0 0 2px 2px;
}

.match-player-name {
  padding: 1px;
}

.match-score {
  text-align: center;
  background: #ebebeb;
  border-left: 1px solid #aaaaaa;
  line-height: 22px;
}

.match-elf {
  background: rgb(184, 242, 184);
}

.match-human {
  background: rgb(184, 184, 242);
}

.match-orc {
  background: rgb(242, 184, 184);
}

.match-ud {
  background: rgb(242, 184, 242);
}

.country-flag__container {
  width: 15px;
  height: 10px;
  display: inline-block;
}

</style>