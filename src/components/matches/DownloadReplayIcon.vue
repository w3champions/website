<template>
  <v-tooltip top style="white-space: pre-line">
    <template v-slot:activator="{ on }">
      <span v-on="on">
        <v-btn
          class="ma-2"
          icon
          outlined
          :loading="downloading"
          :disabled="downloading"
          @click="downloadReplay"
        >
          <v-icon :max-height="18" :max-width="18">{{ mdiDownload }}</v-icon>
        </v-btn>
      </span>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useI18n } from "vue-i18n";
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
    const downloading = ref(false);
    const tooltip = ref<TranslateResult>(t("components_matches_replayicon.download"));

    async function downloadReplay(): Promise<void> {
      downloading.value = true;

      try {
        // Download the replay
        const url = `${API_URL}api/replays/${props.gameId}`;
        window.open(url, "_self");
      } catch (error) {
        console.error("Error downloading replay:", error);
      } finally {
        downloading.value = false;
      }
    }

    return {
      mdiDownload,
      tooltip,
      downloadReplay,
      downloading,
    };
  },
});
</script>
