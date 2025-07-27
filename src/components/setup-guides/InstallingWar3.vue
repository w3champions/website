<template>
    <v-card-text class="px-16">
      <v-card-text>
        {{ $t("views_gettingstarted.introinstallwar3") }}
        <ul>
          <li>
            {{ $t("views_gettingstarted.logoutinstall1") }}
          </li>
          <li>
            {{ $t("views_gettingstarted.logoutinstall2") }}
          </li>
        </ul>
        <br />
        <img class="launcher-screenshot" src="/assets/installingWar3/install_unlogged.png">
        <br />
        {{ $t("views_gettingstarted.loginbnet") }}
        <br />
        {{ $t("views_gettingstarted.playwar3") }}
        <br />
        <br />
        <img class="launcher-screenshot" src="/assets/installingWar3/play_logged.png">
      </v-card-text>
    </v-card-text>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { LAUNCHER_UPDATE_URL } from "@/main";
import { useI18n } from "vue-i18n-bridge";
import { 
  mdiDownload, 
  mdiCheckCircle, 
  mdiLifebuoy, 
  mdiChat 
} from "@mdi/js";

export default defineComponent({
  name: "InstallingWar3",
  setup() {
    const { t } = useI18n();

    const tabsModel = ref({ self: "setup-guides" });
    const quickStartStep = ref(1);
    const settingsPanel = ref([]);
    const troubleshootingPanel = ref([]);
    const advancedPanel = ref([]);

    const launcherWindowsUrl = "https://github.com/w3champions/w3champions-launcher/releases/latest";
    const launcherMacUrl = "https://github.com/w3champions/w3champions-launcher/releases/latest";
    const manualDownloadUrl = "https://github.com/w3champions/w3champions-launcher/releases/latest";
    const discordUrl = "https://discord.gg/w3champions";
    const launcherUrlMac = ref<string>(LAUNCHER_UPDATE_URL + "launcher/mac");
    const launcherEUrl = ref<string>(LAUNCHER_UPDATE_URL + "launcher-e");

    const launcherFeatures = computed(() => [
      t("views_setupguides.feature_auto_update"),
      t("views_setupguides.feature_map_download"),
      t("views_setupguides.feature_one_click"),
      t("views_setupguides.feature_stats_integration"),
      t("views_setupguides.feature_replay_management")
    ]);

    return {
      tabsModel,
      quickStartStep,
      settingsPanel,
      troubleshootingPanel,
      advancedPanel,
      launcherWindowsUrl,
      launcherMacUrl,
      manualDownloadUrl,
      discordUrl,
      launcherFeatures,
      mdiDownload,
      mdiCheckCircle,
      mdiLifebuoy,
      mdiChat,
      launcherUrlMac,
      launcherEUrl
    };
  },
});
</script>

<style lang="scss" scoped>
.v-stepper {
  box-shadow: none;
}

.v-card {
  border-radius: 8px;
}

.v-expansion-panel-content {
  padding: 16px 24px;
}

h3 {
  margin-bottom: 16px;
  color: var(--v-primary-base);
}

h4 {
  margin-bottom: 12px;
  font-weight: 600;
}

code {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
}

ul, ol {
  margin: 12px 0;
  padding-left: 24px;
}

li {
  margin-bottom: 8px;
}

.launcher-screenshot {
  width: 100%;
  margin-bottom: 10px;
}
</style>