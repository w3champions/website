<template>
  <v-container class="ma-0 pa-0">
    <div v-if="isPrivate">
      <span class="font-weight-bold" :class="getTeamColor(team)">{{ sentBy }} (to {{ sentTo }}):</span>
      <span>{{ content }}</span>
    </div>
    <div v-else>
      <span class="font-weight-bold" :class="getTeamColor(team)">
        {{ sentBy }} ({{ scopeToString(scope) }}):
      </span>
      <span>{{ content }}</span>
    </div>
  </v-container>
</template>

<script lang="ts">
import { computed, PropType, defineComponent } from "vue";
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
    const isPrivate = computed<boolean>(() => props.scope == EChatScope.PLAYER ? true : false);

    function getTeamColor(team: number): string {
      if (props.scope == EChatScope.OBSERVERS) return "text-black";

      switch (team) {
        case 0:
          return "text-red";
        case 1:
          return "text-blue";
        case 2:
          return "text-green";
        case 3:
          return "text-purple";
        default:
          return "text-black";
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
