<template>
  <div class="recent-performance">
    <h5 class="recent-performance__title">
      {{ $t("components_player_recentperformance.recentperformance") }}
    </h5>
    <ul class="recent-performance__results">
      <li v-for="(resultSymbol, index) in lastTenMatchesPerformance" :key="resultSymbol + index">
        <v-chip color="transparent" :title="resultSymbol === 'W' ? 'Win' : 'Loss'" label style="padding: 0">
          <v-icon class="sword-icon" :color="resultSymbol === 'W' ? 'green' : 'red'">
            {{ mdiShieldSwordOutline }}
          </v-icon>
        </v-chip>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mdiShieldSwordOutline } from "@mdi/js";

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
    return { mdiShieldSwordOutline };
  },
});
</script>

<style lang="scss" scoped>
.sword-icon {
  font-size: 20px;
  height: 20px;
  width: 20px;
}

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
