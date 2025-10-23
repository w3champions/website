<template>
  <v-tooltip location="top">
    <template v-slot:activator="{ props }">
      <div
        style="display: inline"
        class="cursor-pointer player-name"
        v-bind="props"
        @click.left="openPlayerProfile(playerId.battleTag)"
        @click.middle="openPlayerProfileInNewTab(playerId.battleTag)"
      >
        {{ playerId.name }}<span v-if="alias" class="alias"> ({{ alias }})</span>
      </div>
    </template>
    <div>
      <span>
        {{ playerId.battleTag }}
      </span>
    </div>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { PlayerId } from "@/store/ranking/types";
import { getProfileUrl } from "@/helpers/url-functions";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "PlayerRankInfo",
  components: {},
  props: {
    playerId: {
      type: Object as PropType<PlayerId>,
      required: true,
    },
    alias: {
      type: String,
      required: false,
      default: "",
    },
  },
  setup() {
    const router = useRouter();

    function openPlayerProfile(playerId: string): void {
      router.push({
        path: getProfileUrl(playerId),
      });
    }

    function openPlayerProfileInNewTab(playerId: string): void {
      const path = getProfileUrl(playerId);
      window.open(path, "_blank");
    }

    return {
      openPlayerProfile,
      openPlayerProfileInNewTab,
    };
  },
});
</script>

<style lang="scss" scoped>
.player-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 10rem;
}

.alias {
  font-style: italic;
  opacity: 0.8;
  font-size: 0.9em;
}
</style>
