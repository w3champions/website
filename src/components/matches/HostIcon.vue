<template>
  <v-tooltip bottom transition="scroll-y-transition" style="white-space: pre-line">
    <template v-slot:activator="{ on }">
      <div v-on="on" class="globe">
        <v-img :src="icon" :max-height="18" :max-width="18"></v-img>
      </div>
    </template>
    <span>{{ tooltip }}</span>
    <table style="width: 100%">
      <tr v-for="playerInfo in host.playerServerInfos" :key="playerInfo.battleTag">
        <td>{{ stripTag(playerInfo.battleTag) }}</td>
        <td>{{ playerInfo.averagePing }}ms</td>
      </tr>
    </table>
  </v-tooltip>
</template>

<script lang="ts">
import { computed, PropType, defineComponent } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { TranslateResult } from "vue-i18n";
import { getAsset } from "@/helpers/url-functions";
import { ServerInfo } from "@/store/types";

export default defineComponent({
  name: "HostIcon",
  components: {},
  props: {
    host: {
      type: Object as PropType<ServerInfo>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const icon = computed<string>(() => {
      if (!props.host) return getAsset(`icons/hosterror.png`);
      return getAsset(`icons/${props.host.provider}.png`);
    });

    const tooltip = computed<TranslateResult>(() => {
      if (!props.host) return t("components_matches_hosticon.error");
      if (props.host.provider === "BNET") return t("components_matches_hosticon.hostedonbnet");
      return `${t("components_matches_hosticon.hostedonflo")} / ${props.host.name}`;
    });

    function stripTag(tag: string): string {
      if (!tag) return "";

      const hashIndex = tag.indexOf("#");
      if (hashIndex != -1) return tag.substring(0, hashIndex);
      return tag;
    }

    return {
      icon,
      tooltip,
      stripTag,
    };
  },
});
</script>

<style lang="scss" scoped>
.globe {
  display: inline-block;
}
</style>
