<template>
  <v-tooltip location="top" content-class="w3-tooltip elevation-1">
    <template v-slot:activator="{ props }">
      <span v-bind="props">
        <v-btn
          class="ma-2"
          icon
          variant="outlined"
          :loading="downloading"
          :disabled="downloading"
          size="small"
          @click="downloadReplay"
        >
          <v-icon size="x-large">{{ mdiDownload }}</v-icon>
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
