<template>
  <v-tooltip top v-if="season">
    <template #activator="{ on }">
      <div
        @click="() => onClick?.(season)"
        v-on="on"
        :class="['season-badge', 'pointer']"
        :style="{ 'background-image': 'url(' + seasonBadgeBg + ')' }"
      >
      </div>
    </template>
    <span>
      {{ $t("components_player_seasonbadge.participatedinseason") }} {{ seasonId }}
    </span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { getAsset } from "@/helpers/url-functions";
import { Season } from "@/store/ranking/types";

export default defineComponent({
  name: "SeasonBadge",
  components: {},
  props: {
    season: {
      type: Object as PropType<Season>,
      required: true,
    },
    onClick: {
      type: Function,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const seasonId = ref<string>(props.season.id === 0 ? "β" : props.season.id.toString());
    const seasonBadgeBg = ref<string>(getAsset(`seasonBadges/Season_${props.season.id}.png`));

    return {
      seasonId,
      seasonBadgeBg,
    };
  },
});
</script>

<style lang="scss" scoped>
.season-badge {
  width: 24px;
  height: 24px;
  background-size: cover;
  display: inline-block;
  vertical-align: middle;
}
</style>
