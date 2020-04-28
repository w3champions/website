<template>
      <div class="LadderSummaryShowcase-card mt-1" :class="leagueName">
        <h2 class="LadderSummaryShowcase-title">{{leagueMode}} {{leagueName}}</h2>
        <div class="LadderSummaryShowcase-subtitle">
        <span>Rank {{modeStat.rank}} | {{modeStat.wins}} - {{modeStat.losses}}</span>
        </div>
        <img class="LadderSummaryShowcase-divider" src="https://static.starcraft2.com/dist/images/ladder/profile-ladders-summary-small-divider.png">
        <div>
        <div class="text-center">
            <span>MMR: {{modeStat.mmr}}</span>
            <span class="ml-2" style="font-size:13px">RP: {{modeStat.rankingPoints}}</span>
        </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum, EGameMode } from "@/store/typings";
import { RaceStat, ModeStat } from "@/store/player/types";

@Component({})
export default class PlayerLeague extends Vue {
  @Prop() modeStat!: ModeStat;

    get leagueMode(): string {
        if (!this.modeStat) {
            return '';
        }

        switch(this.modeStat.mode) {
            case EGameMode.GM_1ON1: return '1v1';
            case EGameMode.GM_2ON2: return '2v2';
            case EGameMode.GM_4ON4: return '4v4';
            case EGameMode.GM_FFA: return 'FFA';
            default: return '';
        }
    }

    get leagueName(): string {
        if (!this.modeStat) {
            return '';
        }

        if (this.modeStat.rank == 0) {
            return 'unranked';
        }

         switch(this.modeStat.leagueOrder) {
            case 0: return 'grandmaster';
            case 1: return 'master';
            case 2: return 'diamond';
            case 3: return 'platinum';
            case 4: return 'gold';
            case 5: return 'silver';
            case 6: return 'bronze';
            default: return '';
        }
    }
}
</script>

<style lang="scss" scoped>
.grandmaster:after {
    background-image: url(https://w3champions.com/integration/leagues/0.png);
    background-repeat: no-repeat;
}

.grandmaster:before {
    border-top: 2px solid #593BA8;
}

// gold

.gold:after {
    background-image: url(https://w3champions.com/integration/leagues/4.png);
    background-repeat: no-repeat;
}

.gold:before {
    border-top: 2px solid #EEBF01;
}

// diamond

.diamond:after {
    background-image: url(https://w3champions.com/integration/leagues/2.png);
    background-repeat: no-repeat;
}

.diamond:before {
    border-top: 2px solid #2C33FF;
}

// unranked

.unranked:after {
    background-image: url(https://static.starcraft2.com/dist/images/none.c8b435f5900fab1ac7981cc9b56f6f44.png);
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
    background-color: rgba(9,28,46,.31);
    padding-bottom: 30px;
}

.LadderSummaryShowcase-card:before {
    border: 2px solid #122a42;
    background: none;
    box-shadow: 2px 2px 5px rgba(0,0,0,.467);
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    pointer-events: none;
    right: 0;
    top: 0;
    margin: initial;
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
    margin-top: .4em;
    font: 400 .8em Eurostile;
    text-align: center;
    text-transform: uppercase;
    font-size: 20px;
}

.LadderSummaryShowcase-divider {
    width: 100%;
    height: auto;
}
</style>