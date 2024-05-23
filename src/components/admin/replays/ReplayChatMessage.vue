<template>
  <v-container class="ma-0 pa-0">
    <div v-if="isPrivate">
      <span class="font-weight-bold" :class="getTeamColor(team)">{{ sentBy }} (to {{ sentTo }}):</span>
      <span class="text-black">{{ content }}</span>
    </div>
    <div v-else>
      <span class="font-weight-bold" :class="getTeamColor(team)">
        {{ sentBy }} ({{ scopeToString(scope) }}):
      </span>
      <span class="text-black">{{ content }}</span>
    </div>
  </v-container>
</template>

<script lang="ts">
import { computed, ComputedRef, PropType, defineComponent } from "vue";
import { EChatScope } from "@/store/common/types";

export default defineComponent({
  name: "ReplayChatMessage",
  components: {},
  props: {
    sentBy: { type: String, required: true },
    team: { type: Number, required: true },
    content: { type: String, required: true },
    scope: { type: Number as PropType<EChatScope>, required: true },
    sentTo: { type: String, required: false, default: undefined },
  },
  setup(props) {
    const isPrivate: ComputedRef<boolean> = computed((): boolean => props.scope == EChatScope.PLAYER ? true : false);

    function getTeamColor(team: number): string {
      if (props.scope == EChatScope.OBSERVERS) return "black--text";

      switch (team) {
        case 0:
          return "red--text";
        case 1:
          return "blue--text";
        case 2:
          return "green--text";
        case 3:
          return "purple--text";
        default:
          return "black--text";
      }
    }

    function scopeToString(scope: EChatScope): string {
      switch (scope) {
        case EChatScope.ALL:
          return "All";
        case EChatScope.ALLIES:
          return "Allies";
        case EChatScope.OBSERVERS:
          return "Observers";
        default:
          return "";
      }
    }


    return {
      isPrivate,
      getTeamColor,
      scopeToString,
    };
  },
});
</script>
