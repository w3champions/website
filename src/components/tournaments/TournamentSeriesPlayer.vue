<template>
  <div v-bind:class="`player ${side} ${won ? 'winner' : 'loser'}`" v-bind:style="style">
    <span class="player-slot d-flex align-center" v-bind:class="raceClass" v-bind:style="slotStyle">
      <span class="player-country d-flex justify-center align-center">
        <country-flag-extended
          class="country-flag"
          :location="countryCode"
          :clickable="false"
        />
      </span>
      <span class="player-name">
        {{ name }}
      </span>
    </span>
    <span class="player-score-box d-flex justify-center align-center">
      <span class="player-score">
        {{ score }}
      </span>
    </span>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, StyleValue } from "vue";
import isNil from "lodash/isNil";
import { ISeriesPlayer } from "@/store/tournaments/types";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { ERaceEnum } from "@/store/types";
import { battleTagToName } from "@/helpers/profile";

export default defineComponent({
  name: "TournamentSeriesPlayer",
  components: {
    CountryFlagExtended,
  },
  props: {
    player: { type: Object as PropType<ISeriesPlayer | undefined>, required: true },
    side: { type: String as PropType<"top" | "bottom">, required: true },
    playerHeight: { type: Number, required: true },
    roundWidth: { type: Number, required: true },
    seriesFinished: { type: Boolean, required: false, default: undefined },
    seriesSpecial: { type: Boolean, required: false, default: undefined },
    seriesCanceled: { type: Boolean, required: false, default: undefined },
  },
  setup(props) {
    const won = computed(() => props.player?.won ?? false);
    const name = computed(() => battleTagToName(props.player?.battleTag ?? ""));
    const countryCode = computed(() => props.player?.countryCode);

    const score = computed<string>(() => {
      if (!props.seriesFinished) return "";
      if (isNil(props.player)) return "";

      let score = "";
      if (!isNil(props.player.score)) {
        score = props.player.score.toString();
      }
      if (!isNil(props.player) && !props.seriesCanceled) {
        score = props.player.won ? "1" : "0";
      }
      if (props.seriesSpecial) {
        score += "*";
      }

      return score;
    });

    const raceClass = computed<string>(() => {
      if (isNil(props.player)) return "";

      const race = props.player.race;
      return ERaceEnum[race].toLowerCase();
    });

    const style = computed<StyleValue>(() => {
      let height = props.playerHeight;
      if (props.side === "bottom") {
        // Subtract 2px to account for the 1px outer border and 1px divider border
        height -= 2;
      }
      return {
        height: `${height}px`,
      };
    });

    const slotStyle = computed<StyleValue>(() => {
      return {
        // subtract box and border width
        "max-width": `${props.roundWidth - 27 - 2}px`,
      };
    });

    return {
      won,
      name,
      countryCode,
      score,
      raceClass,
      style,
      slotStyle,
      battleTagToName
    };
  },
});
</script>

<style lang="scss">
.player {
  border-color: darkgrey;
  border-style: solid;
  border-width: 0px;
  display: flex;
}
.player.top {
  border-bottom-width: 1px;
}
.player.bottom {
  border-top-width: 1px;
}
.player.winner {
  font-weight: bold;
}
.player-slot {
  width: -webkit-fill-available;
  height: 100%;
}
.player-slot.human {
  background-color: #b8b8f2;
}
.player-slot.orc {
  background-color: #f2b8b8;
}
.player-slot.night_elf {
  background-color: #b8f2b8;
}
.player-slot.undead {
  background-color: #f2b8f2;
}
.player-slot.random {
  background-color: #f2f2b8;
}
.player-country {
  padding: 5px;
  padding-bottom: 1px;
  height: 100%;
  width: 28px;
}
.player-score-box {
  height: 100%;
  min-width: 27px;
  background: lightgrey;
  border-left: 1px solid darkgrey;
}
.player-score {
  position: relative;
  left: -1px;
}
.player-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
