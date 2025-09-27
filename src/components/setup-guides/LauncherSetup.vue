<template>
  <v-row class="justify-center">
    <v-col>
      <v-container>
        <v-card-title class="text-center">
          {{ $t("views_gettingstarted.howtoinstall") }}
        </v-card-title>
        <v-tabs v-model="tabsModel.self" vertical class="ml-4">
          <v-tabs-slider />
          <v-tab class="profileTab" :href="`#launcher`">
            {{ $t("views_gettingstarted.launcher") }}
          </v-tab>
          <v-tab class="profileTab" :href="`#windows-setup`">
            {{ $t("views_gettingstarted.manualwin") }}
          </v-tab>
          <v-tab class="profileTab" :href="`#mac-setup`">
            {{ $t("views_gettingstarted.manualmac") }}
          </v-tab>
          <v-tabs-items :value="tabsModel.self" touchless>
            <v-tab-item value="launcher">
              <v-card-text class="pt-0 px-8">
                <h3>{{ $t("views_gettingstarted.downloadw3ctitle") }}</h3>
                <br />
                <v-card-text>
                  <v-btn
                    :href="launcherEUrl"
                    target="_blank"
                    class="join-button mt-0 mb-4"
                  >
                    <v-icon>{{ mdiDownload }}</v-icon>
                    <span class="mr-2 hidden-xs-only">Windows</span>
                  </v-btn>
                  <v-btn
                    :href="launcherUrlMac"
                    target="_blank"
                    class="join-button mt-0 mb-4 ml-8"
                  >
                    <v-icon>{{ mdiDownload }}</v-icon>
                    <span class="mr-2 hidden-xs-only">Mac</span>
                  </v-btn>
                </v-card-text>
                <h3>{{ $t("views_gettingstarted.launchertitle") }}</h3>
                <br />
                <img class="launcher-screenshot" src="/assets/gettingStarted/launcher1.jpg" />
                <img class="launcher-screenshot" src="/assets/gettingStarted/launcher2.jpg" />
                <img class="launcher-screenshot" src="/assets/gettingStarted/launcher3.jpg" />
                <v-card-text>
                  {{ $t("views_gettingstarted.launcherfeaturestitle") }}
                  <ul>
                    <li>
                      {{ $t("views_gettingstarted.launcherfeaturesbody1") }}
                    </li>
                    <li>
                      {{ $t("views_gettingstarted.launcherfeaturesbody2") }}
                    </li>
                    <li>
                      {{ $t("views_gettingstarted.launcherfeaturesbody3") }}
                    </li>
                    <li>
                      {{ $t("views_gettingstarted.launcherfeaturesbody4") }}
                    </li>
                    <li>
                      {{ $t("views_gettingstarted.launcherfeaturesbody5") }}
                    </li>
                  </ul>
                </v-card-text>
              </v-card-text>
            </v-tab-item>
            <v-tab-item value="windows-setup">
              <v-card-text class="pt-0 px-8">
                <v-alert outlined type="info" prominent border="left">
                  {{ alertMessage }}
                </v-alert>
                <h3 class="mt-10">
                  {{ $t("views_gettingstarted.manualwintitle") }}
                </h3>
                <p>
                  {{ $t("views_gettingstarted.manualwinbody1") }}
                </p>
                <v-btn
                  class="w3-background"
                  color="primary"
                  :href="ingameAddonLink"
                  target="_blank"
                  outlined
                >
                  <v-icon>{{ mdiDownload }}</v-icon>
                  <span class="mr-2 hidden-xs-only">
                    {{ $t("views_gettingstarted.manualwinbody2") }}
                  </span>
                </v-btn>
                <p class="mt-2">
                  {{ $t("views_gettingstarted.manualwinbody3") }}
                  <br />
                  <code>{{ $t("views_gettingstarted.manualwinbody3_1") }}</code>
                </p>
                <p>
                  <i style="color: red">
                    {{ $t("views_gettingstarted.manualwinbody4") }}
                  </i>
                  <br />
                  {{ $t("views_gettingstarted.manualwinbody5") }}
                  <br />
                  <code>
                    {{ $t("views_gettingstarted.manualwinbody6") }}
                  </code>
                  <br />
                  <code>
                    {{ $t("views_gettingstarted.manualwinbody7") }}
                  </code>
                  <br />

                  {{ $t("views_gettingstarted.manualwinbody8") }}
                  <br />
                </p>
              </v-card-text>
            </v-tab-item>
            <v-tab-item value="mac-setup">
              <v-card-text class="pt-0 px-8">
                <v-alert outlined type="info" prominent border="left">
                  {{ alertMessage }}
                </v-alert>
                <h3 class="mt-10">{{ $t("views_gettingstarted.manualmactitle") }}</h3>
                <p>{{ $t("views_gettingstarted.manualmacbody1") }}</p>
                <v-btn
                  class="w3-background"
                  color="primary"
                  :href="webUiLink"
                  target="_blank"
                  outlined
                >
                  <v-icon>{{ mdiDownload }}</v-icon>
                  <span class="mr-2 hidden-xs-only">{{ $t("views_gettingstarted.manualmacbody2") }}</span>
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
                  class="w3-background"
                  color="primary"
                  :href="mapsLink"
                  target="_blank"
                  outlined
                >
                  <v-icon>{{ mdiDownload }}</v-icon>
                  <span class="mr-2 hidden-xs-only">{{ $t("views_gettingstarted.manualmacbody8") }}</span>
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
                  <iframe src="https://www.youtube.com/embed/8s53BHfKPLs" frameborder="0" allowfullscreen></iframe>
                </div>
              </v-card-text>
            </v-tab-item>
          </v-tabs-items>
        </v-tabs>
      </v-container>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { LAUNCHER_UPDATE_URL } from "@/main";
import { mdiDownload } from "@mdi/js";
import { useRoute, useRouter } from "vue-router/composables";

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
.important {
  color: red;
  font-weight: bold;
}

.important-dark {
  color: black;
  font-weight: bold;
}

.v-tab--active::before {
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

.launcher-screenshot {
  width: 100%;
  margin-bottom: 10px;
}
</style>