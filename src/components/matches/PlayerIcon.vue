<script lang="ts">
import Vue, { CreateElement, RenderContext, VNode } from "vue";
import { ERaceEnum } from "@/store/types";

interface IProps {
  race: ERaceEnum;
  left: boolean;
  big: boolean;
  rndRace: ERaceEnum;
}

export default Vue.component<IProps>("PlayerIcon", {
  functional: true,
  props: {
    race: {
      type: Number,
      required: true,
    },
    left: {
      type: Boolean,
      default: false,
    },
    big: {
      type: Boolean,
      default: false,
    },
    rndRace: {
      type: Number,
      required: false,
    },
  },
  render(h: CreateElement, { props, data }: RenderContext<IProps>): VNode {
    const rndRaceClass = props.rndRace ? `_${ERaceEnum[props.rndRace]}` : "";

    const classes = [
      data.class,
      data.staticClass,
      `race-icon-${ERaceEnum[props.race]}${rndRaceClass}`,
      props.big ? "race-icon-big" : "race-icon",
      props.left ? "alignLeft" : "alignRight",
    ];

    return h("span", { class: classes.join(" ") });
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
