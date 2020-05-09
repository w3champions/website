<template>
  <div class="LadderSummaryShowcase-card mt-1" :class="leagueName">
    <h2 class="LadderSummaryShowcase-title">
      {{ leagueMode }} {{ leagueName }} {{modeStat.division !== 0 ? this.modeStat.division : null}}
    </h2>
    <div class="LadderSummaryShowcase-subtitle">
      <span
        >Rank <span class="number-text">{{ modeStat.rank }} | {{ modeStat.wins }} -
        {{ modeStat.losses }}</span></span
      >
    </div>
    <img
      class="LadderSummaryShowcase-divider"
      src="https://static.starcraft2.com/dist/images/ladder/profile-ladders-summary-small-divider.png"
    />
    <div>
      <div class="text-center">
        <span>MMR: <span class="number-text">{{ modeStat.mmr }}</span></span>
        <span class="ml-2" style="font-size:13px"
        >RP: <span class="number-text">{{ modeStat.rankingPoints }}</span></span
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { EGameMode } from "@/store/typings";
import { ModeStat } from "@/store/player/types";

@Component({})
export default class PlayerLeague extends Vue {
  @Prop() modeStat!: ModeStat;

  get leagueMode() {
    return this.$t(`gameModes.${EGameMode[this.modeStat.mode]}`);
  }

  get leagueName(): string {
    if (!this.modeStat) {
      return "";
    }

    if (this.modeStat.rank == 0) {
      return "unranked";
    }

    switch (this.modeStat.leagueOrder) {
      case 0:
        return "grandmaster";
      case 1:
        return "master";
      case 2:
        return "diamond";
      case 3:
        return "platinum";
      case 4:
        return "gold";
      case 5:
        return "silver";
      case 6:
        return "bronze";
      default:
        return "";
    }
  }
}
</script>

<style lang="scss" scoped>
// grandmaster
.grandmaster:after {
  background-image: url(../../assets/leagueFlags/grandmaster.png);
  background-repeat: no-repeat;
}

.LadderSummaryShowcase-card.grandmaster:before {
  border-top: 2px solid #593ba8 !important;
}

// master
.master:after {
  background-image: url(../../assets/leagueFlags/master.png);
  background-repeat: no-repeat;
}

.LadderSummaryShowcase-card.master:before {
  border-top: 2px solid #593ba8 !important;
}

// diamond
.diamond:after {
  background-image: url(../../assets/leagueFlags/diamond.png);
  background-repeat: no-repeat;
}

.LadderSummaryShowcase-card.diamond:before {
  border-top: 2px solid #2c33ff !important;
}

// platinum
.platinum:after {
  background-image: url(../../assets/leagueFlags/platinum.png);
  background-repeat: no-repeat;
}

.LadderSummaryShowcase-card.platinum:before {
  border-top: 2px solid #a0b3c2 !important;
}

// gold
.gold:after {
  background-image: url(../../assets/leagueFlags/gold.png);
  background-repeat: no-repeat;
}

.LadderSummaryShowcase-card.gold:before {
  border-top: 2px solid #eebf01 !important;
}

// silver
.silver:after {
  background-image: url(../../assets/leagueFlags/silver.png);
  background-repeat: no-repeat;
}

.LadderSummaryShowcase-card.silver:before {
  border-top: 2px solid #97a1a8 !important;
}

// bronze
.bronze:after {
  background-image: url(../../assets/leagueFlags/bronze.png);
  background-repeat: no-repeat;
}

.LadderSummaryShowcase-card.bronze:before {
  border-top: 2px solid #955941 !important;
}

// unranked
.unranked:after {
  background-image: url(../../assets/leagueFlags/unranked.png);
  background-repeat: no-repeat;
  background-position: 0 -315px;
}

// common

.LadderSummaryShowcase-card:after {
  width: 100px;
  height: 100px;
  -ms-flex: 0 0 100px;
  flex: 0 0 100px;
  height: 105px;
  content: "";
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: -50px;
}

.LadderSummaryShowcase-card {
  position: relative;
  padding: 1em;
  background-color: rgba(9, 28, 46, 0.31);
  padding-bottom: 30px;
  min-height: 181px;
}

.LadderSummaryShowcase-card:before {
  border: 2px solid #122a42;
  background: none;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.467);
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  pointer-events: none;
  right: 0;
  top: 0;
  margin: initial;
}

.theme--light {
  .LadderSummaryShowcase-card:before {
    border: 2px solid rgb(205, 205, 205);
  }

  .LadderSummaryShowcase-card {
    background-color: transparent;
  }

  .LadderSummaryShowcase-title:first-child {
    color: black;
  }

  .LadderSummaryShowcase-subtitle {
    color: black;
  }
}

.LadderSummaryShowcase-title:first-child {
  margin-top: 40px;
  margin-bottom: 0;
  text-align: center;
  font-family: Eurostile;
  font-weight: 700;
  font-size: 1.1em;
  text-transform: uppercase;
  color: #fff;
  letter-spacing: normal;
}

.LadderSummaryShowcase-subtitle {
  color: #7aa3cc;
  margin-top: 0.4em;
  font: 400 0.8em Eurostile;
  text-align: center;
  text-transform: uppercase;
  font-size: 20px;
}

.LadderSummaryShowcase-divider {
  width: 100%;
  height: auto;
}
</style>
