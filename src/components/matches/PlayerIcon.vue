<template>
  <span :class="classes"></span>
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
}

.race-icon-big {
  width: 36px;
  height: 36px;
  background-position: center;
  background-size: cover;
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
