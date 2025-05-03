<template>
  <v-tooltip top style="white-space: pre-line">
    <template v-slot:activator="{ on }">
      <span v-on="on" :class="classes"></span>
    </template>
    <span>{{ (isRandom ? `${$t("races.RANDOM")} -> ` : "") + $t(`races.${raceName}`) }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { ERaceEnum } from "@/store/types";

export default defineComponent({
  name: "PlayerIcon",
  components: {},
  props: {
    race: {
      type: Number as PropType<ERaceEnum>,
      required: true,
    },
    left: {
      type: Boolean,
      required: false,
      default: false,
    },
    big: {
      type: Boolean,
      required: false,
      default: false,
    },
    rndRace: {
      type: Number as PropType<ERaceEnum>,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const rndRaceClass = props.rndRace ? `_${ERaceEnum[props.rndRace]}` : "";

    const classes = [
      `race-icon-${ERaceEnum[props.race]}${rndRaceClass}`,
      props.big ? "race-icon-big" : "race-icon",
      props.left ? "alignLeft" : "alignRight",
    ];

    return {
      classes,
      isRandom: props.rndRace !== null,
      raceName: ERaceEnum[props.rndRace] ?? ERaceEnum[props.race],
    };
  },
});
</script>

<style lang="scss">
.race-icon {
  width: 32px;
  height: 32px;
  background-position: center;
  background-size: cover;
  display: inline-block;
  vertical-align: middle;

  // The race icons have a bit of extra room
  // on the bottom for the shadow, so lets account
  // for that with a negative margin to visually
  // align it with text beside it.
  margin-top: 2px;
  margin-bottom: -2px;
}

.race-icon-big {
  width: 36px;
  height: 36px;
  background-position: center;
  background-size: cover;
  display: inline-block;
  vertical-align: middle;

  margin-top: 2px;
  margin-bottom: -2px;
}

.race-icon-HUMAN {
  background-image: url("/assets/raceIcons/HUMAN.png");
}

.race-icon-RANDOM_HUMAN {
  background-image: url("/assets/raceIcons/HumanRandom.png");
}

.race-icon-ORC {
  background-image: url("/assets/raceIcons/ORC.png");
}

.race-icon-RANDOM_ORC {
  background-image: url("/assets/raceIcons/OrcRandom.png");
}

.race-icon-UNDEAD {
  background-image: url("/assets/raceIcons/UNDEAD.png");
}

.race-icon-RANDOM_UNDEAD {
  background-image: url("/assets/raceIcons/UndeadRandom.png");
}

.race-icon-NIGHT_ELF {
  background-image: url("/assets/raceIcons/NIGHT_ELF.png");
}

.race-icon-RANDOM_NIGHT_ELF {
  background-image: url("/assets/raceIcons/NightElfRandom.png");
}

.race-icon-RANDOM {
  background-image: url("/assets/raceIcons/RANDOM.png");
}
</style>
