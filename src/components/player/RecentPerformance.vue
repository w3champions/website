<template>
  <div class="recent-performance">
    <h5 class="recent-performance__title">
      {{ $t("components_player_recentperformance.recentperformance") }}
    </h5>
    <ul class="recent-performance__results">
      <li v-for="(resultSymbol, index) in lastTenMatchesPerformance" :key="resultSymbol + index">
        <span :class="resultSymbol === 'W' ? 'won' : 'lost'">{{ resultSymbol }}</span>
        <span v-if="index < lastTenMatchesPerformance.length - 1">-</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "RecentPerformance",
  components: {},
  props: {
    lastTenMatchesPerformance: {
      type: Array<string>,
      required: true,
    },
  },
  setup() {
     // example: ['W', 'W', 'W', 'L', 'L', 'W', 'L', 'W', 'L', 'L']
    return {};
  },
});
</script>

<style lang="scss" scoped>
.recent-performance {
  margin-top: 0.4em;

  &__title {
    text-align: center;
  }

  &__results {
    display: flex;
    justify-content: center;
    padding: 0;
    list-style-type: none;
  }
}
</style>
