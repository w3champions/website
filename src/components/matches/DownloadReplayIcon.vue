<template>
  <v-tooltip location="top" content-class="w3-tooltip elevation-1">
    <template v-slot:activator="{ props }">
      <span v-bind="props">
        <v-btn
          class="ma-2 w3-gray-gold-text"
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
  <v-snackbar v-model="showError" color="error" timeout="4000" location="top">
    {{ errorMessage }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { API_URL } from "@/config/env";
import { mdiDownload } from "@mdi/js";

const { gameId } = defineProps({
  gameId: {
    type: String,
    required: true,
  }
});

const { t } = useI18n();
const downloading = ref(false);
const tooltip = ref<string>(t("components_matches_replayicon.download"));
const showError = ref(false);
const errorMessage = ref("");

async function downloadReplay(): Promise<void> {
  downloading.value = true;

  try {
    const url = `${API_URL}api/replays/${gameId}`;
    const response = await fetch(url);
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

    if (response.status === 429) {
      throw new Error(t("components_matches_replayicon.rateLimited"));
    }

    if (response.status === 404) {
      throw new Error(t("components_matches_replayicon.notFound"));
    }

    if (!response.ok || contentType.includes("json")) {
      throw new Error(t("components_matches_replayicon.unavailable"));
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${gameId}.w3g`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Error downloading replay:", error);
    errorMessage.value = error instanceof Error ? error.message : t("components_matches_replayicon.unavailable");
    showError.value = true;
    tooltip.value = errorMessage.value;
    window.setTimeout(() => {
      tooltip.value = t("components_matches_replayicon.download");
    }, 4000);
  } finally {
    downloading.value = false;
  }
}
</script>
