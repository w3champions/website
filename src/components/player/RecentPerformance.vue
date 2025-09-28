<template>
  <div class="recent-performance">
    <h5 class="recent-performance__title">
      {{ $t("components_player_recentperformance.recentperformance") }}
    </h5>
    <div class="recent-performance__results-wrapper">
      <ul :class="{ 'recent-performance__results': true, 'enough-items': lastTenMatchesPerformance.length > 1 }">
        <li v-for="(resultSymbol, index) in lastTenMatchesPerformance.slice().reverse()" :key="resultSymbol + index">
          <v-chip color="transparent" :title="resultSymbol === 'W' ? 'Win' : 'Loss'" label style="padding: 0">
            <v-icon class="sword-icon" :color="resultSymbol === 'W' ? 'green' : 'red'">
              {{ mdiShieldSwordOutline }}
            </v-icon>
          </v-chip>
        </li>
      </ul>
    </div>
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

  &__results-wrapper {
    display: flex;
    justify-content: center;
  }

  &__results {
    position: relative;
    padding: 0 0 5px 0;
    display: flex;
    justify-content: center;
    list-style-type: none;
    width: fit-content;

    &.enough-items {
      mask-image: linear-gradient(to left, black 70%, rgba(0, 0, 0, 0.4));
      mask-size: 100% 100%;
      mask-repeat: no-repeat;
    }

    &.enough-items::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(
        to left,
        color-mix(in srgb, var(--v-theme-primary) 70%, transparent) 70%,
        color-mix(in srgb, var(--v-theme-primary) 20%, transparent)
      );
      pointer-events: none;
      border-radius: 4px;
    }
  }
}
</style>
