<template>
  <v-row class="justify-center">
    <v-col>
      <v-container>
        <v-card tile>
          <v-card-title class="text-center">
            {{ $t("views_setupguides.title") }}
          </v-card-title>
          <v-tabs v-model="tabsModel.self" vertical class="ml-5">
            <v-tabs-slider></v-tabs-slider>
            <v-tab class="profileTab" :href="`#getting-started`">
              {{ $t("views_setupguides.getting_started") }}
            </v-tab>
            <v-tab class="profileTab" :href="`#launcher-setup`">
              {{ $t("views_setupguides.launcher_setup") }}
            </v-tab>
            <v-tab class="profileTab" :href="`#game-settings`">
              {{ $t("views_setupguides.game_settings") }}
            </v-tab>
            <v-tab class="profileTab" :href="`#troubleshooting`">
              {{ $t("views_setupguides.troubleshooting") }}
            </v-tab>
            <v-tab class="profileTab" :href="`#advanced`">
              {{ $t("views_setupguides.advanced") }}
            </v-tab>
            <v-tabs-items :value="tabsModel.self" touchless>
              <v-tab-item value="getting-started">
                <v-card-text class="px-16">
                  <h3>{{ $t("views_setupguides.welcome_title") }}</h3>
                  <p>{{ $t("views_setupguides.welcome_description") }}</p>
                  
                  <v-alert outlined type="info" prominent border="left" class="mb-6">
                    {{ $t("views_setupguides.new_user_tip") }}
                  </v-alert>

                  <h4 class="mb-3">{{ $t("views_setupguides.quick_start_title") }}</h4>
                  <v-stepper v-model="quickStartStep" vertical>
                    <v-stepper-step :complete="quickStartStep > 1" step="1">
                      {{ $t("views_setupguides.step1_title") }}
                      <small>{{ $t("views_setupguides.step1_subtitle") }}</small>
                    </v-stepper-step>
                    <v-stepper-content step="1">
                      <v-card color="grey lighten-1" class="mb-12" height="200px">
                        <v-card-text>
                          <p>{{ $t("views_setupguides.step1_description") }}</p>
                          <v-btn color="primary" @click="quickStartStep = 2">
                            {{ $t("views_setupguides.continue") }}
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-stepper-content>

                    <v-stepper-step :complete="quickStartStep > 2" step="2">
                      {{ $t("views_setupguides.step2_title") }}
                      <small>{{ $t("views_setupguides.step2_subtitle") }}</small>
                    </v-stepper-step>
                    <v-stepper-content step="2">
                      <v-card color="grey lighten-1" class="mb-12" height="200px">
                        <v-card-text>
                          <p>{{ $t("views_setupguides.step2_description") }}</p>
                          <v-btn color="primary" @click="quickStartStep = 3">
                            {{ $t("views_setupguides.continue") }}
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-stepper-content>

                    <v-stepper-step :complete="quickStartStep > 3" step="3">
                      {{ $t("views_setupguides.step3_title") }}
                      <small>{{ $t("views_setupguides.step3_subtitle") }}</small>
                    </v-stepper-step>
                    <v-stepper-content step="3">
                      <v-card color="grey lighten-1" class="mb-12" height="200px">
                        <v-card-text>
                          <p>{{ $t("views_setupguides.step3_description") }}</p>
                          <v-btn color="success" @click="quickStartStep = 1">
                            {{ $t("views_setupguides.start_playing") }}
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-stepper-content>
                  </v-stepper>
                </v-card-text>
              </v-tab-item>

              <v-tab-item value="launcher-setup">
                <v-card-text class="px-16">
                  <h3>{{ $t("views_setupguides.launcher_title") }}</h3>
                  <p>{{ $t("views_setupguides.launcher_description") }}</p>

                  <h4 class="mt-6 mb-3">{{ $t("views_setupguides.download_launcher") }}</h4>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-card outlined>
                        <v-card-title>Windows</v-card-title>
                        <v-card-text>
                          <p>{{ $t("views_setupguides.windows_requirements") }}</p>
                          <v-btn color="primary" large block :href="launcherWindowsUrl" target="_blank">
                            <v-icon left>{{ mdiDownload }}</v-icon>
                            {{ $t("views_setupguides.download_windows") }}
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-card outlined>
                        <v-card-title>macOS</v-card-title>
                        <v-card-text>
                          <p>{{ $t("views_setupguides.mac_requirements") }}</p>
                          <v-btn color="primary" large block :href="launcherMacUrl" target="_blank">
                            <v-icon left>{{ mdiDownload }}</v-icon>
                            {{ $t("views_setupguides.download_mac") }}
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <h4 class="mt-6 mb-3">{{ $t("views_setupguides.launcher_features") }}</h4>
                  <v-list>
                    <v-list-item v-for="(feature, index) in launcherFeatures" :key="index">
                      <v-list-item-icon>
                        <v-icon>{{ mdiCheckCircle }}</v-icon>
                      </v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>{{ feature }}</v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-tab-item>

              <v-tab-item value="game-settings">
                <v-card-text class="px-16">
                  <h3>{{ $t("views_setupguides.game_settings_title") }}</h3>
                  <p>{{ $t("views_setupguides.game_settings_description") }}</p>

                  <v-expansion-panels v-model="settingsPanel" multiple>
                    <v-expansion-panel>
                      <v-expansion-panel-header>
                        {{ $t("views_setupguides.video_settings") }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <p>{{ $t("views_setupguides.video_settings_content") }}</p>
                        <ul>
                          <li>{{ $t("views_setupguides.resolution_tip") }}</li>
                          <li>{{ $t("views_setupguides.graphics_tip") }}</li>
                          <li>{{ $t("views_setupguides.vsync_tip") }}</li>
                        </ul>
                      </v-expansion-panel-content>
                    </v-expansion-panel>

                    <v-expansion-panel>
                      <v-expansion-panel-header>
                        {{ $t("views_setupguides.audio_settings") }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <p>{{ $t("views_setupguides.audio_settings_content") }}</p>
                        <ul>
                          <li>{{ $t("views_setupguides.master_volume_tip") }}</li>
                          <li>{{ $t("views_setupguides.sound_effects_tip") }}</li>
                          <li>{{ $t("views_setupguides.music_tip") }}</li>
                        </ul>
                      </v-expansion-panel-content>
                    </v-expansion-panel>

                    <v-expansion-panel>
                      <v-expansion-panel-header>
                        {{ $t("views_setupguides.gameplay_settings") }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <p>{{ $t("views_setupguides.gameplay_settings_content") }}</p>
                        <ul>
                          <li>{{ $t("views_setupguides.hotkeys_tip") }}</li>
                          <li>{{ $t("views_setupguides.camera_tip") }}</li>
                          <li>{{ $t("views_setupguides.tooltips_tip") }}</li>
                        </ul>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-card-text>
              </v-tab-item>

              <v-tab-item value="troubleshooting">
                <v-card-text class="px-16">
                  <h3>{{ $t("views_setupguides.troubleshooting_title") }}</h3>
                  <p>{{ $t("views_setupguides.troubleshooting_description") }}</p>

                  <v-expansion-panels v-model="troubleshootingPanel">
                    <v-expansion-panel>
                      <v-expansion-panel-header>
                        {{ $t("views_setupguides.connection_issues") }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <v-alert type="warning" outlined>
                          {{ $t("views_setupguides.connection_warning") }}
                        </v-alert>
                        <h4>{{ $t("views_setupguides.common_solutions") }}</h4>
                        <ol>
                          <li>{{ $t("views_setupguides.solution_firewall") }}</li>
                          <li>{{ $t("views_setupguides.solution_antivirus") }}</li>
                          <li>{{ $t("views_setupguides.solution_ports") }}</li>
                          <li>{{ $t("views_setupguides.solution_restart") }}</li>
                        </ol>
                      </v-expansion-panel-content>
                    </v-expansion-panel>

                    <v-expansion-panel>
                      <v-expansion-panel-header>
                        {{ $t("views_setupguides.performance_issues") }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <h4>{{ $t("views_setupguides.performance_tips") }}</h4>
                        <ul>
                          <li>{{ $t("views_setupguides.perf_tip_1") }}</li>
                          <li>{{ $t("views_setupguides.perf_tip_2") }}</li>
                          <li>{{ $t("views_setupguides.perf_tip_3") }}</li>
                          <li>{{ $t("views_setupguides.perf_tip_4") }}</li>
                        </ul>
                      </v-expansion-panel-content>
                    </v-expansion-panel>

                    <v-expansion-panel>
                      <v-expansion-panel-header>
                        {{ $t("views_setupguides.launcher_issues") }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <h4>{{ $t("views_setupguides.launcher_solutions") }}</h4>
                        <ol>
                          <li>{{ $t("views_setupguides.launcher_solution_1") }}</li>
                          <li>{{ $t("views_setupguides.launcher_solution_2") }}</li>
                          <li>{{ $t("views_setupguides.launcher_solution_3") }}</li>
                        </ol>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                  </v-expansion-panels>

                  <v-card outlined class="mt-6">
                    <v-card-title>
                      <v-icon left>{{ mdiLifebuoy }}</v-icon>
                      {{ $t("views_setupguides.need_help") }}
                    </v-card-title>
                    <v-card-text>
                      <p>{{ $t("views_setupguides.help_description") }}</p>
                      <v-btn color="primary" :href="discordUrl" target="_blank">
                        <v-icon left>{{ mdiChat }}</v-icon>
                        {{ $t("views_setupguides.join_discord") }}
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-card-text>
              </v-tab-item>

              <v-tab-item value="advanced">
                <v-card-text class="px-16">
                  <h3>{{ $t("views_setupguides.advanced_title") }}</h3>
                  <p>{{ $t("views_setupguides.advanced_description") }}</p>

                  <v-alert type="error" outlined class="mb-6">
                    {{ $t("views_setupguides.advanced_warning") }}
                  </v-alert>

                  <v-expansion-panels v-model="advancedPanel">
                    <v-expansion-panel>
                      <v-expansion-panel-header>
                        {{ $t("views_setupguides.manual_installation") }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <p>{{ $t("views_setupguides.manual_install_desc") }}</p>
                        <h4>{{ $t("views_setupguides.windows_manual") }}</h4>
                        <ol>
                          <li>{{ $t("views_setupguides.manual_step_1") }}</li>
                          <li>{{ $t("views_setupguides.manual_step_2") }}</li>
                          <li>{{ $t("views_setupguides.manual_step_3") }}</li>
                        </ol>
                        <v-btn color="primary" :href="manualDownloadUrl" target="_blank">
                          <v-icon left>{{ mdiDownload }}</v-icon>
                          {{ $t("views_setupguides.download_manual") }}
                        </v-btn>
                      </v-expansion-panel-content>
                    </v-expansion-panel>

                    <v-expansion-panel>
                      <v-expansion-panel-header>
                        {{ $t("views_setupguides.custom_maps") }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <p>{{ $t("views_setupguides.custom_maps_desc") }}</p>
                        <code>{{ $t("views_setupguides.maps_folder_path") }}</code>
                        <p class="mt-3">{{ $t("views_setupguides.custom_maps_note") }}</p>
                      </v-expansion-panel-content>
                    </v-expansion-panel>

                    <v-expansion-panel>
                      <v-expansion-panel-header>
                        {{ $t("views_setupguides.network_config") }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <p>{{ $t("views_setupguides.network_config_desc") }}</p>
                        <h4>{{ $t("views_setupguides.required_ports") }}</h4>
                        <ul>
                          <li>TCP: 6112-6119</li>
                          <li>UDP: 6112-6119</li>
                          <li>TCP: 3724</li>
                        </ul>
                        <p class="mt-3">{{ $t("views_setupguides.port_forwarding_note") }}</p>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-card-text>
              </v-tab-item>
            </v-tabs-items>
          </v-tabs>
        </v-card>
      </v-container>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useI18n } from "vue-i18n-bridge";
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
</style>