<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            <span>{{ $t("views_setupguides.title") }}</span>
          </v-card-title>
          <v-tabs>
            <v-tabs-slider />
            <v-tab
              class="profileTab"
              exact
              :to="{ name: ESetupGuidesRouteName.LAUNCHER_SETUP }">
              {{ $t("views_setupguides.launcher_setup") }}
            </v-tab>
            <v-tab
              class="profileTab"
              :to="{ name: ESetupGuidesRouteName.INSTALLING_WAR3 }">
              {{ $t("views_setupguides.installing_war3") }}
            </v-tab>
          </v-tabs>
          <v-card-text>
            <keep-alive>
              <router-view></router-view>
            </keep-alive>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { LAUNCHER_UPDATE_URL } from "@/main";
import { useI18n } from "vue-i18n-bridge";
import { ESetupGuidesRouteName } from "@/router/types";
import { 
  mdiDownload, 
  mdiCheckCircle, 
  mdiLifebuoy, 
  mdiChat 
} from "@mdi/js";

export default defineComponent({
  name: "SetupGuides",
  setup() {
    const { t } = useI18n();
    
    const tabsModel = ref({ self: "getting-started" });
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
      launcherEUrl,
      ESetupGuidesRouteName
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