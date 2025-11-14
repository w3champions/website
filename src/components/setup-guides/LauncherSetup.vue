<template>
  <v-row class="justify-center">
    <v-col cols="12">
      <v-container class="overflow-x-auto">
        <v-card-title>
          {{ $t("views_gettingstarted.howtoinstall") }}
        </v-card-title>

        <v-row>
          <!-- Tabs: always vertical, full width on mobile, sidebar on md+ -->
          <v-col cols="12" md="3">
            <v-tabs
              v-model="tabsModel.self"
              direction="vertical"
              class="ml-md-4"
            >
              <v-tab value="launcher">
                {{ $t("views_gettingstarted.launcher") }}
              </v-tab>
              <v-tab value="windows-setup">
                {{ $t("views_gettingstarted.manualwin") }}
              </v-tab>
              <v-tab value="mac-setup">
                {{ $t("views_gettingstarted.manualmac") }}
              </v-tab>
            </v-tabs>
          </v-col>

          <!-- Content -->
          <v-col cols="12" md="9">
            <v-window :model-value="tabsModel.self">
              <!-- LAUNCHER TAB -->
              <v-window-item value="launcher">
                <v-card-text class="pt-0 px-3">
                  <h3>{{ $t("views_gettingstarted.downloadw3ctitle") }}</h3>
                  <br />
                  <v-card-text class="pa-0">
                    <v-btn
                      :href="launcherEUrl"
                      target="_blank"
                      class="join-button mt-0 mb-4"
                    >
                      <v-icon>{{ mdiDownload }}</v-icon>
                      <span class="mr-2">Windows</span>
                    </v-btn>
                    <v-btn
                      :href="launcherUrlMac"
                      target="_blank"
                      class="join-button mt-0 mb-4 ml-8"
                    >
                      <v-icon>{{ mdiDownload }}</v-icon>
                      <span class="mr-2">Mac</span>
                    </v-btn>
                  </v-card-text>
                  <h3>{{ $t("views_gettingstarted.launchertitle") }}</h3>
                  <br />
                  <img class="mb-3 w-100" src="/assets/gettingStarted/launcher1.jpg" />
                  <img class="mb-3 w-100" src="/assets/gettingStarted/launcher2.jpg" />
                  <img class="mb-3 w-100" src="/assets/gettingStarted/launcher3.jpg" />
                  <v-card-text>
                    {{ $t("views_gettingstarted.launcherfeaturestitle") }}
                    <ul>
                      <li>{{ $t("views_gettingstarted.launcherfeaturesbody1") }}</li>
                      <li>{{ $t("views_gettingstarted.launcherfeaturesbody2") }}</li>
                      <li>{{ $t("views_gettingstarted.launcherfeaturesbody3") }}</li>
                      <li>{{ $t("views_gettingstarted.launcherfeaturesbody4") }}</li>
                      <li>{{ $t("views_gettingstarted.launcherfeaturesbody5") }}</li>
                    </ul>
                  </v-card-text>
                </v-card-text>
              </v-window-item>

              <!-- WINDOWS SETUP TAB -->
              <v-window-item value="windows-setup">
                <v-card-text class="pt-0 px-3">
                  <v-alert variant="outlined" type="info" prominent border="start">
                    {{ alertMessage }}
                  </v-alert>
                  <h3 class="mt-10">
                    {{ $t("views_gettingstarted.manualwintitle") }}
                  </h3>
                  <p>
                    {{ $t("views_gettingstarted.manualwinbody1") }}
                  </p>
                  <v-btn
                    color="primary"
                    :href="ingameAddonLink"
                    target="_blank"
                    variant="outlined"
                  >
                    <v-icon>{{ mdiDownload }}</v-icon>
                    <span class="mr-2 hidden-xs">
                      {{ $t("views_gettingstarted.manualwinbody2") }}
                    </span>
                  </v-btn>
                  <div class="mt-3">
                    <div>{{ $t("views_gettingstarted.manualwinbody3") }}</div>
                    <code>{{ $t("views_gettingstarted.manualwinbody3_1") }}</code>
                  </div>
                  <div class="mt-3">
                    <i style="color: red">{{ $t("views_gettingstarted.manualwinbody4") }}</i>
                    <div>{{ $t("views_gettingstarted.manualwinbody5") }}</div>
                    <code>{{ $t("views_gettingstarted.manualwinbody6") }}</code>
                    <div>{{ $t("views_gettingstarted.manualwinbody7") }}</div>
                    <code>{{ $t("views_gettingstarted.manualwinbody8") }}</code>
                  </div>
                </v-card-text>
              </v-window-item>

              <!-- MAC SETUP TAB -->
              <v-window-item value="mac-setup">
                <v-card-text class="pt-0 px-3">
                  <v-alert variant="outlined" type="info" prominent border="start">
                    {{ alertMessage }}
                  </v-alert>
                  <h3 class="mt-10">{{ $t("views_gettingstarted.manualmactitle") }}</h3>
                  <p>{{ $t("views_gettingstarted.manualmacbody1") }}</p>
                  <v-btn
                    color="primary"
                    :href="webUiLink"
                    target="_blank"
                    variant="outlined"
                  >
                    <v-icon>{{ mdiDownload }}</v-icon>
                    <span class="mr-2 hidden-xs">
                      {{ $t("views_gettingstarted.manualmacbody2") }}
                    </span>
                  </v-btn>
                  <p class="mt-2">
                    {{ $t("views_gettingstarted.manualmacbody3") }}
                    <br />
                    <code>{{ $t("views_gettingstarted.manualmacbody4") }}</code>
                  </p>
                  <p>
                    {{ $t("views_gettingstarted.manualmacbody5") }}
                    <br />
                    <code>{{ $t("views_gettingstarted.manualmacbody6") }}</code>
                  </p>
                  <p>{{ $t("views_gettingstarted.manualmacbody7") }}</p>
                  <v-btn
                    color="primary"
                    :href="mapsLink"
                    target="_blank"
                    variant="outlined"
                  >
                    <v-icon>{{ mdiDownload }}</v-icon>
                    <span class="mr-2 hidden-xs">
                      {{ $t("views_gettingstarted.manualmacbody8") }}
                    </span>
                  </v-btn>
                  <p class="mt-2">
                    {{ $t("views_gettingstarted.manualmacbody9") }}
                    <br />
                    <code>{{ $t("views_gettingstarted.manualmacbody10") }}</code>
                  </p>
                  <p>
                    <i style="color: red">{{ $t("views_gettingstarted.manualmacbody11") }}</i>
                    <br />
                    {{ $t("views_gettingstarted.manualmacbody12") }}
                    <br />
                    <code>{{ $t("views_gettingstarted.manualmacbody13") }}</code>
                    <br />
                    <code>{{ $t("views_gettingstarted.manualmacbody14") }}</code>
                    <br />
                    {{ $t("views_gettingstarted.manualmacbody15") }}
                    <br />
                    <code>{{ $t("views_gettingstarted.manualmacbody16") }}</code>
                    <br />
                    <code>{{ $t("views_gettingstarted.manualmacbody17") }}</code>
                    <br />
                  </p>
                  <p class="mt-2">{{ $t("views_gettingstarted.manualmacbody18") }}</p>
                  <div>
                    <ul>
                      <li>
                        {{ $t("views_gettingstarted.manualmacbody19") }}
                        <code>{{ $t("views_gettingstarted.manualmacbody19_1") }}</code>
                      </li>
                      <li>{{ $t("views_gettingstarted.manualmacbody20") }}</li>
                      <li>{{ $t("views_gettingstarted.manualmacbody21") }}</li>
                      <li>{{ $t("views_gettingstarted.manualmacbody22") }}</li>
                    </ul>
                  </div>
                  <div class="mt-10 video-container">
                    <iframe
                      src="https://www.youtube.com/embed/8s53BHfKPLs"
                      frameborder="0"
                      allowfullscreen
                    ></iframe>
                  </div>
                </v-card-text>
              </v-window-item>
            </v-window>
          </v-col>
        </v-row>
      </v-container>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { LAUNCHER_UPDATE_URL } from "@/main";
import { mdiDownload } from "@mdi/js";
import { useRoute, useRouter } from "vue-router";

export default defineComponent({
  name: "LauncherSetup",
  components: {},
  setup() {
    const alertMessage = ref<string>("These steps are only needed if you have problems with the normal W3Champions App. In that case, please reach out on Discord!");
    const ingameAddonLink = ref<string>(LAUNCHER_UPDATE_URL + "ingame-addon");
    const webUiLink = ref<string>(LAUNCHER_UPDATE_URL + "webui");
    const mapsLink = ref<string>(LAUNCHER_UPDATE_URL + "maps");
    const launcherUrlMac = ref<string>(LAUNCHER_UPDATE_URL + "launcher/mac");
    const launcherEUrl = ref<string>(LAUNCHER_UPDATE_URL + "launcher-e");
    const route = useRoute();
    const router = useRouter();
    const tabsModel = ref({ self: (route.query.tabsModel as string) || "launcher" });

    watch(() => tabsModel.value.self, (newVal) => {
      if (route.query.tabsModel !== newVal) {
        router.replace({
          query: {
            ...route.query,
            tabsModel: newVal
          }
        });
      }
    });

    return {
      tabsModel,
      ingameAddonLink,
      alertMessage,
      mdiDownload,
      webUiLink,
      mapsLink,
      launcherUrlMac,
      launcherEUrl
    };
  },
});
</script>
<style lang="scss" scoped>
.v-tab--selected::after {
  opacity: 0.12 !important;
}

.video-container {
  position: relative;
  padding-bottom: 62.25%;
  height: 0;
  overflow: hidden;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

code {
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: small;
}

.v-theme--human, .v-theme--orc {
  code {
    background-color: rgba(0, 0, 0, 0.1);
  }
}

.v-theme--nightelf, .v-theme--undead {
  code {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
