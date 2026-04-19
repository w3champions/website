<template>
  <v-tooltip location="bottom" content-class="w3-tooltip elevation-1">
    <template v-slot:activator="{ props }">
      <div v-bind="props">
        <v-img :src="icon" :width="18" :height="18" />
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

<script setup lang="ts">
import { computed, PropType } from "vue";
import { useI18n } from "vue-i18n";
import { TranslateResult } from "vue-i18n";
import { getAsset } from "@/helpers/url-functions";
import { ServerInfo } from "@/store/types";

const { host } = defineProps({
  host: {
    type: Object as PropType<ServerInfo>,
    required: true,
  }
});

const { t } = useI18n();

const icon = computed<string>(() => {
  if (!host) return getAsset("icons/hosterror.png");
  return getAsset(`icons/${host.provider}.png`);
});

const tooltip = computed<TranslateResult>(() => {
  if (!host) return t("components_matches_hosticon.error");
  if (host.provider === "BNET") return t("components_matches_hosticon.hostedonbnet");
  return `${t("components_matches_hosticon.hostedonflo")} / ${host.name}`;
});

function stripTag(tag: string): string {
  if (!tag) return "";

  const hashIndex = tag.indexOf("#");
  if (hashIndex != -1) return tag.substring(0, hashIndex);
  return tag;
}
</script>
