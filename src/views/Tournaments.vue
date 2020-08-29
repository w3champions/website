<template>
  <v-container>
    <v-card class="mt-2 pl-2" tile>
      <v-card-title class="search-bar"></v-card-title>
      <div class="bracket-wrapper bracket-player">
        <div class="bracket-scroller">
          <div style="width: 325px;" class="bracket bracket-width-2col-20">
            <div
              class="bracket-column bracket-column-matches"
              style="width: 150px;"
            >
              <div style="height: 40px; margin-top: 0px;">
                <div class="bracket-header">
                  Round 1
                </div>
              </div>
              <div
                class="bracket-game"
                v-for="(match, matchIndex) in matches"
                :key="matchIndex"
              >
                <div class="icon" style="margin-top: 30px; right: 16px;" />
                <div class="bracket-cell-r1" 
                    v-for="(player, playerIndex) in match.players"
                    :key="playerIndex"
                >
                  <div
                    v-bind:class="getClass(player, playerIndex)"
                    style="padding-right: 23px; cursor: pointer;"
                  >
                    &nbsp; &nbsp;
                    <span style="vertical-align: -1px;">{{player.name}}</span>
                    <div class="bracket-score" style="width: 21px;" />
                  </div>
                </div>
              </div>
            </div>
            <div class="bracket-column" style="width: 20px;">
              <div style="float: left; width: 9px;">
                <div style="width: 9px; height: 75px;"></div>
                <div
                  style="
                    width: 9px;
                    height: 16px;
                    border-top-right-radius: 3px;
                    border: solid #aaa;
                    border-width: 2px 2px 0 0;
                  "
                ></div>
                <div style="width: 9px; height: 38px;"></div>
                <div
                  style="
                    width: 9px;
                    height: 16px;
                    border-bottom-right-radius: 3px;
                    border: solid #aaa;
                    border-width: 0 2px 2px 0;
                  "
                ></div>
                <div style="width: 9px; height: 33px;"></div>
              </div>
              <div style="float: left; width: 9px;">
                <div style="width: 9px; height: 93px;"></div>
                <div
                  style="
                    width: 9px;
                    height: 6px;
                    border-bottom-left-radius: 3px;
                    border: solid #aaa;
                    border-width: 0 0 2px 2px;
                  "
                ></div>
                <div style="width: 9px; height: 22px;"></div>
                <div
                  style="
                    width: 9px;
                    height: 6px;
                    border-top-left-radius: 3px;
                    border: solid #aaa;
                    border-width: 2px 0 0 2px;
                  "
                ></div>
                <div style="width: 9px; height: 51px;"></div>
              </div>
            </div>
            <div
              class="bracket-column bracket-column-matches"
              style="width: 150px;"
            >
              <div style="height: 40px; margin-top: 0px;">
                <div class="bracket-header">Round 2</div>
              </div>
              <div class="bracket-game">
                <div class="icon" style="margin-top: 66px; right: 16px;" />
                <div class="bracket-cell-r2" style="">
                  <div
                    class="bracket-player-top"
                    style="padding-right: 23px; cursor: pointer;"
                    title="Click for further information"
                    data-highlightingkey=""
                  >
                    &nbsp; &nbsp;
                    <span style="vertical-align: -1px;" />
                    <div class="bracket-score" style="width: 21px;" />
                  </div>
                </div>
                <div
                  class="bracket-popup-wrapper bracket-popup-player"
                  style="margin-left: 150px;"
                >
                  <div class="bracket-popup">
                    <div class="bracket-popup-header">
                      <div class="bracket-popup-header-left">
                        TBD&nbsp;
                        <span class="race-icon-small">
                          <a href="/warcraft/TBD" title="TBD"></a>
                        </span>
                      </div>
                      <div class="bracket-popup-header-right">
                        <span class="race-icon-small">
                          <a href="/warcraft/TBD" title="TBD"></a>
                        </span>
                        &nbsp;TBD
                      </div>
                    </div>
                    <div class="bracket-popup-body">
                      <div class="bracket-popup-body-time">
                        <span class="timer-object" data-timestamp="1598796000">
                          <span class="timer-object-date">
                            August 30, 2020 - 17:00
                            <abbr
                              data-tz="+3:00"
                              title="Eastern European Summer Time (UTC+3)"
                            >
                              EEST
                            </abbr>
                          </span>
                          <br class="timer-object-separator" />
                          <span class="timer-object-countdown">
                            <span class="timer-object-countdown-time">
                              1d 1h 57m
                            </span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bracket-cell-r1" style="">
                  <div
                    class="bracket-player-bottom"
                    style="padding-right: 23px; cursor: pointer;"
                    title="Click for further information"
                    data-highlightingkey=""
                  >
                    &nbsp;&nbsp;
                    <span style="vertical-align: -1px;" />
                    <div class="bracket-score" style="width: 21px;" />
                  </div>
                </div>
              </div>
              <div class="bracket-game">
                <div class="icon" style="margin-top: 66px; right: 16px;" />
                <div class="bracket-cell-r2" style="">
                  <div
                    class="bracket-player-top"
                    style="padding-right: 23px; cursor: pointer;"
                    title="Click for further information"
                    data-highlightingkey=""
                  >
                    &nbsp; &nbsp;
                    <span style="vertical-align: -1px;" />
                    <div class="bracket-score" style="width: 21px;" />
                  </div>
                </div>
                <div
                  class="bracket-popup-wrapper bracket-popup-player"
                  style="margin-left: 150px;"
                >
                  <div class="bracket-popup">
                    <div class="bracket-popup-header">
                      <div class="bracket-popup-header-left">
                        TBD&nbsp;
                        <span class="race-icon-small">
                          <a href="/warcraft/TBD" title="TBD"></a>
                        </span>
                      </div>
                      <div class="bracket-popup-header-right">
                        <span class="race-icon-small">
                          <a href="/warcraft/TBD" title="TBD"></a>
                        </span>
                        &nbsp;TBD
                      </div>
                    </div>
                    <div class="bracket-popup-body">
                      <div class="bracket-popup-body-time">
                        <span class="timer-object" data-timestamp="1598796000">
                          <span class="timer-object-date">
                            August 30, 2020 - 17:00
                            <abbr
                              data-tz="+3:00"
                              title="Eastern European Summer Time (UTC+3)"
                            >
                              EEST
                            </abbr>
                          </span>
                          <br class="timer-object-separator" />
                          <span class="timer-object-countdown">
                            <span class="timer-object-countdown-time">
                              1d 1h 57m
                            </span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bracket-cell-r1" style="">
                  <div
                    class="bracket-player-bottom"
                    style="padding-right: 23px; cursor: pointer;"
                    title="Click for further information"
                    data-highlightingkey=""
                  >
                    &nbsp;&nbsp;
                    <span style="vertical-align: -1px;" />
                    <div class="bracket-score" style="width: 21px;" />
                  </div>
                </div>
              </div>
              <p>
                <br />
              </p>
            </div>
            <div style="clear: left;"></div>
          </div>
          <div class="bracket-push" />
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import {
  ITournamentPlayer,
  ITournamentMatch,
} from "../store/tournaments/types";
import { ERaceEnum } from "@/store/typings";

@Component({
  components: {},
})
export default class TournamentsView extends Vue {
  get players() {
    const result: ITournamentPlayer[] = [
      { name: "Happy", race: ERaceEnum.UNDEAD },
      { name: "DemusliM", race: ERaceEnum.HUMAN },
      { name: "Grubby", race: ERaceEnum.ORC },
      { name: "Vortix", race: ERaceEnum.UNDEAD },
      { name: "Blade", race: ERaceEnum.HUMAN },
      { name: "Wan", race: ERaceEnum.UNDEAD },
      { name: "Xlord", race: ERaceEnum.UNDEAD },
      { name: "Sonik", race: ERaceEnum.NIGHT_ELF },
    ];

    return result;
  }

  get matches() {
    const result: ITournamentMatch[] = [
      {
        players: [
          { name: "Happy", race: ERaceEnum.UNDEAD },
          { name: "DemusliM", race: ERaceEnum.HUMAN },
        ],
      },
      {
        players: [
          { name: "Grubby", race: ERaceEnum.ORC },
          { name: "Vortix", race: ERaceEnum.UNDEAD },
        ],
      },
      {
        players: [
          { name: "Blade", race: ERaceEnum.HUMAN },
          { name: "Wan", race: ERaceEnum.UNDEAD },
        ],
      },
      {
        players: [
          { name: "Xlord", race: ERaceEnum.UNDEAD },
          { name: "Sonik", race: ERaceEnum.NIGHT_ELF },
        ],
      },
    ];

    return result;
  }

  getClass(player: ITournamentPlayer, index: number) {
      return {
          'bracket-player-top': index == 0,
          'bracket-player-bottom': index == 1,
          'bracket-human': player.race == ERaceEnum.HUMAN,
          'bracket-orc': player.race == ERaceEnum.ORC,
          'bracket-ud': player.race == ERaceEnum.UNDEAD,
          'bracket-elf': player.race == ERaceEnum.NIGHT_ELF,
      }
  }
}
</script>

<style>
.bracket-wrapper {
  min-height: 0.01%;
  pointer-events: auto;
  overflow-x: auto;
  padding-bottom: 15px;
}

.bracket-scroller {
  pointer-events: none;
}

.bracket {
  font-size: 11px;
  color: #000000;
  background: transparent;
  display: table;
  -webkit-transform-origin: left top 0;
  transform-origin: left top 0;
}

.bracket-column {
  float: left;
  position: relative;
}

.bracket-column:not(.bracket-column-matches) {
  margin-left: -0.1px;
}

.bracket-header {
  border-radius: 2px;
  border: 1px solid #aaaaaa;
  padding: 2px 0 2px 0;
  position: relative;
  left: 0;
  right: 0;
  line-height: 18px;
  margin-bottom: 20px;
  text-align: center;
  background: #ebebeb;
}

.bracket-game {
  position: relative;
}

.bracket-game .icon,
.table-battleroyale-results .icon,
.match-row-icon {
  cursor: pointer;
  height: 12px;
  width: 12px;
  background-image: url(data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cdefs%3E%3Cstyle%3E.c%7Bfill%3A%23616161%7D.i%7Bfill%3A%23fff%7D%3C%2Fstyle%3E%3C%2Fdefs%3E%3Ccircle%20class%3D%22c%22%20cx%3D%226%22%20cy%3D%226%22%20r%3D%226%22%2F%3E%3Cpolygon%20class%3D%22i%22%20points%3D%224%205%204%206%205%206%205%209%204%209%204%2010%208%2010%208%209%207%209%207%202%205%202%205%204%207%204%207%205%204%205%22%2F%3E%3C%2Fsvg%3E);
  background-size: contain;
  background-repeat: no-repeat;
  background-color: transparent;
  z-index: 500;
  position: absolute;
  image-rendering: -webkit-optimize-contrast;
}

.bracket-cell-r1,
.bracket-cell-r2,
.bracket-cell-r3,
.bracket-cell-r4,
.bracket-cell-r5,
.bracket-cell-r6,
.bracket-cell-r7 {
  position: relative;
}

.bracket-cell-r1 {
  height: 36px;
}

.bracket-team-top,
.bracket-team-bottom,
.bracket-player-top,
.bracket-player-bottom,
.bracket-team-middle,
.bracket-player-middle,
.bracket-team-inner,
.bracket-player-inner {
  border-radius: 0 0 2px 2px;
  border: solid #aaaaaa 1px;
  position: absolute;
  padding: 1px;
  min-height: 20px;
  line-height: 18px;
  background: #f2f2f2;
  left: 0;
  right: 0;
}

.match-row,
.bracket-hover,
.grouptableslot,
.matchlistslot,
.bracket-team-top,
.bracket-team-bottom,
.bracket-team-middle,
.bracket-team-inner,
.bracket-player-top,
.bracket-player-bottom,
.bracket-player-middle,
.bracket-player-inner {
  transition: 0.5s;
}

.bracket-team-top,
.bracket-player-top {
  bottom: 0;
  border-radius: 2px 2px 0 0;
}

.bracket-score {
  text-align: center;
  background: #ebebeb;
  border-left: 1px solid #aaaaaa;
  position: absolute;
  line-height: 22px;
  right: 0;
  top: 0;
  bottom: 0;
}

.bracket-game .flag img {
  vertical-align: middle;
  width: 18px;
  height: 12px;
  image-rendering: -webkit-optimize-contrast;
}

.flag img {
  width: 18px;
  height: 12px;
  vertical-align: middle;
  image-rendering: -webkit-optimize-contrast;
}

.wiki-warcraft .bracket-popup-wrapper.bracket-popup-player {
  width: 320px;
}

.bracket-popup-wrapper {
  box-sizing: border-box;
  display: none;
  position: fixed;
  transform: translateZ(0);
  z-index: 1000;
  font-weight: normal;
  white-space: normal;
  font-size: 12px;
}

.bracket-cell-r2 {
  height: 72px;
}

.bracket-elf {
  background: rgb(184, 242, 184);
}

.bracket-human {
  background: rgb(184, 184, 242);
}

.bracket-orc {
  background: rgb(242, 184, 184);
}

.bracket-ud {
  background: rgb(242, 184, 242);
}
</style>
