<template>
  <img :src="leagueIcon" class="league-icon" />
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent } from "vue";

export default defineComponent({
  name: "LeagueIcon",
  components: {},
  props: {
    league: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const leagueIcon: ComputedRef<string> = computed((): string => props.league !== undefined ? `/assets/leagueIcons/${props.league}.png` : "");
    return {
      leagueIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
.league-icon {
  width: 24px;
  margin-right: 10px;
  vertical-align: middle;
}
</style>
