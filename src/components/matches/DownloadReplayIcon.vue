<template>
  <v-tooltip top style="white-space: pre-line">
    <template #:activator="{ on }">
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
import { useI18n } from "vue-i18n-bridge";
import { API_URL } from "@/main";
import { mdiDownload } from "@mdi/js";
import { TranslateResult } from "vue-i18n";
import { TurnstileService } from "@/services/TurnstileService";

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
    const turnstileService = TurnstileService.getInstance();
    const downloading = ref(false);
    const tooltip = ref<TranslateResult>(t("components_matches_replayicon.download"));

    async function downloadReplay(): Promise<void> {
      downloading.value = true;

      try {
        // Get Turnstile token if enabled
        let token: string | null = null;
        if (turnstileService.isEnabled()) {
          token = await turnstileService.getToken("download-replay");
          if (!token) {
            // Failed to get token, show error
            console.error("Failed to get Turnstile token");
            return;
          }
        }

        // Download the replay with token in header
        const url = `${API_URL}api/replays/${props.gameId}`;

        if (token) {
          // Use fetch with custom headers when token is present
          const response = await fetch(url, {
            headers: {
              "X-Turnstile-Token": token,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to download replay: ${response.statusText}`);
          }

          // Get the blob and create download link
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `${props.gameId}.w3g`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
        } else {
          // No token needed, use simple download
          window.open(url, "_self");
        }
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
