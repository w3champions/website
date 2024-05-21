<template>
  <v-tooltip top style="white-space: pre-line">
    <template v-slot:activator="{ on }">
      <span v-on="on">
        <v-btn class="ma-2" icon @click="downloadReplay" outlined>
          <v-icon :max-height="18" :max-width="18">{{ mdiDownload }}</v-icon>
        </v-btn>
      </span>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { API_URL } from "@/main";
import { mdiDownload } from "@mdi/js";
import { TranslateResult } from "vue-i18n";

export default defineComponent({
  name: "DownloadReplayIcon",
  components: {},
  props: {
    gameId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const tooltip = ref<TranslateResult>(t("components_matches_replayicon.download"));

    function downloadReplay(): void {
      window.open(`${API_URL}api/replays/${props.gameId}`, "_self");
    }

    return {
      mdiDownload,
      tooltip,
      downloadReplay,
    };
  },
});
</script>
