<template>
  <v-row class="justify-center">
    <v-col>
      <v-container>
        <v-card tile>
          <v-card-title class="text-center">
            {{ $t("views_gettingstarted.howtoinstall")}}
          </v-card-title>
          <v-tabs v-model="tabsModel" vertical class="ml-5">
            <v-tabs-slider></v-tabs-slider>
            <v-tab class="profileTab" :href="`#launcher`">
              {{ $t("views_gettingstarted.launcher") }}
            </v-tab>
            <v-tab class="profileTab" :href="`#windows-setup`">
              {{ $t("views_gettingstarted.manualwin") }}
            </v-tab>
            <v-tab class="profileTab" :href="`#mac-setup`">
              {{ $t("views_gettingstarted.manualmac") }}
            </v-tab>
            <v-tabs-items v-model="tabsModel" touchless>
              <v-tab-item :value="'launcher'">
                <v-card-text class="px-16">
                  <h3>{{ $t("views_gettingstarted.downloadw3ctitle") }}</h3>
                  <br />
                  <v-card-text>
                    <v-btn
                      :href="launcherUrlWin"
                      target="_blank"
                      class="join-button mt-0 mb-4"
                    >
                      <v-icon>mdi-download</v-icon>
                      <span class="mr-2 hidden-xs-only">Windows</span>
                    </v-btn>
                    <v-btn
                      :href="launcherUrlMac"
                      target="_blank"
                      class="join-button mt-0 mb-4 ml-8"
                    >
                      <v-icon>mdi-download</v-icon>
                      <span class="mr-2 hidden-xs-only">Mac</span>
                    </v-btn>
                  </v-card-text>
                  <br/>
                  <h3>{{ $t("views_gettingstarted.launchertitle") }}</h3>
                  <br/><br/>
                  <div class="w3c-screenshot" />
                  <br/>
                  <br/>
                  <div class="w3c-screenshot-chat" />
                  <br/>
                  <br/>
                  <div class="w3c-screenshot-map-select" />
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
              <v-tab-item :value="'windows-setup'">
                <v-card-text class="px-16">
                  <v-alert
                      outlined
                      type="warning"
                      prominent
                      border="left"
                  >
                    {{ alertMessage }}
                  </v-alert>
                  <h3 class="mt-10">{{ $t("views_gettingstarted.manualwintitle") }}</h3>
                  <p>
                    {{ $t("views_gettingstarted.manualwinbody1") }}
                  </p>
                  <v-btn
                    class="w3-background"
                    color="primary"
                    :href="webUiLink"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">{{ $t("views_gettingstarted.manualwinbody2") }}</span>
                  </v-btn>
                  <p class="mt-2">
                    {{ $t("views_gettingstarted.manualwinbody3") }}<br />
                    <code>{{ $t("views_gettingstarted.manualwinbody4") }}</code>
                  </p>
                  <p>
                    {{ $t("views_gettingstarted.manualwinbody5") }}<br />
                    <code>{{ $t("views_gettingstarted.manualwinbody6") }}</code>
                  </p>
                  <p>{{ $t("views_gettingstarted.manualwinbody7") }}</p>
                  <v-btn
                    class="w3-background"
                    color="primary"
                    :href="mapsLink"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">
                      {{ $t("views_gettingstarted.manualwinbody8") }}
                    </span>
                  </v-btn>
                  <p class="mt-2">
                    {{ $t("views_gettingstarted.manualwinbody9") }}
                    <br />
                    <code>{{ $t("views_gettingstarted.manualwinbody10") }}</code>
                  </p>
                  <p>
                    <i style="color: red;">{{ $t("views_gettingstarted.manualwinbody11") }}</i> <br/>
                    {{ $t("views_gettingstarted.manualwinbody12") }}<br/>
                    <code>{{ $t("views_gettingstarted.manualwinbody13") }}</code> <br/>
                    <code>{{ $t("views_gettingstarted.manualwinbody14") }}</code> <br/>

                    {{ $t("views_gettingstarted.manualwinbody15") }}<br/>
                    <code>{{ $t("views_gettingstarted.manualwinbody16") }}</code> <br/>
                    <code>{{ $t("views_gettingstarted.manualwinbody17") }}</code> <br/>
                  </p>
                  <p class="mt-2">
                    {{ $t("views_gettingstarted.manualwinbody18") }}
                    <br />
                  </p>
                  <p>
                    <ul>
                      <li>
                        {{ $t("views_gettingstarted.manualwinbody19") }}
                      </li>
                      <li>
                        {{ $t("views_gettingstarted.manualwinbody20") }}
                      </li>
                      <li>
                        {{ $t("views_gettingstarted.manualwinbody21") }}
                        <ul>
                          <li>
                            {{ $t("views_gettingstarted.manualwinbody22") }}
                          </li>
                          <li>
                            {{ $t("views_gettingstarted.manualwinbody23") }}
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </p>
                </v-card-text>
              </v-tab-item>
              <v-tab-item :value="'mac-setup'">
                <v-card-text class="px-16">
                  <v-alert
                      outlined
                      type="warning"
                      prominent
                      border="left"
                  >
                    {{ alertMessage }}
                  </v-alert>
                  <h3 class="mt-10">{{ $t("views_gettingstarted.manualmactitle") }}</h3>
                  <p>
                    {{ $t("views_gettingstarted.manualmacbody1") }}
                  </p>
                  <v-btn
                    class="w3-background"
                    color="primary"
                    :href="webUiLink"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
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
                    <code>
                      {{ $t("views_gettingstarted.manualmacbody6") }}
                    </code>
                  </p>
                  <p>
                    {{ $t("views_gettingstarted.manualmacbody7") }}
                  </p>
                  <v-btn
                    class="w3-background"
                    color="primary"
                    :href="mapsLink"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">
                      {{ $t("views_gettingstarted.manualmacbody8") }}
                    </span>
                  </v-btn>
                  <p class="mt-2">
                    {{ $t("views_gettingstarted.manualmacbody9") }}
                    <br />
                    <code>{{ $t("views_gettingstarted.manualmacbody10") }}</code>
                  </p>
                  <p>
                    <i style="color: red;">{{ $t("views_gettingstarted.manualmacbody11") }}</i> <br/>
                    {{ $t("views_gettingstarted.manualmacbody12") }}<br/>
                    <code>{{ $t("views_gettingstarted.manualmacbody13") }}</code> <br/>
                    <code>{{ $t("views_gettingstarted.manualmacbody14") }}</code> <br/>

                    {{ $t("views_gettingstarted.manualmacbody15") }}<br/>
                    <code>{{ $t("views_gettingstarted.manualmacbody16") }}</code> <br/>
                    <code>{{ $t("views_gettingstarted.manualmacbody17") }}</code> <br/>
                  </p>
                  <p class="mt-2">{{ $t("views_gettingstarted.manualmacbody18") }}</p>
                  <p>
                    <ul>
                      <li>
                        {{ $t("views_gettingstarted.manualmacbody19") }}<code>{{ $t("views_gettingstarted.manualmacbody19_1") }}</code>
                      </li>
                      <li>
                        {{ $t("views_gettingstarted.manualmacbody20") }}
                      </li>
                      <li>
                        {{ $t("views_gettingstarted.manualmacbody21") }}
                      </li>
                      <li>
                        {{ $t("views_gettingstarted.manualmacbody22") }}
                      </li>
                    </ul>
                  </p>
                  <div class="mt-10 video-container">
                    <iframe src="https://www.youtube.com/embed/8s53BHfKPLs" frameborder="0" allowfullscreen></iframe>
                  </div>
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
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { LAUNCHER_UPDATE_URL } from "@/main";

@Component({})
export default class GettingStartedView extends Vue {

  get alertMessage() {
    return "Those steps are only needed, if you have problems with the normal w3champions App. In that case, please reach out on discord!"
  }

  get webUiLink() {
    return LAUNCHER_UPDATE_URL + "webui";
  }

  get mapsLink() {
    return LAUNCHER_UPDATE_URL + "maps";
  }

  get launcherUrlMac() {
    return LAUNCHER_UPDATE_URL + "launcher/mac";
  }

  get launcherUrlWin() {
    return LAUNCHER_UPDATE_URL + "launcher/win";
  }

  data() {
    return {
      tabsModel: null,
    };
  }
}
</script>

<style scoped>
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

.theme--dark.v-application .v-btn.join-button {
  text-shadow: none !important;
  color: black !important;
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

.w3c-screenshot {
  width: 100%;
  padding-bottom: 56%;
  background-image: url("../assets/gettingStarted/startButton.png");
  background-size: cover;
}

.w3c-launcher-screenshot {
   width: 100%;
   padding-bottom: 64.5%;
   background-image: url("../assets/gettingStarted/launcher.png");
   background-size: cover;
 }

.w3c-screenshot-chat {
  width: 100%;
  padding-bottom: 56%;
  background-image: url("../assets/gettingStarted/chatOverview.png");
  background-size: cover;
}

.w3c-screenshot-map-select {
  width: 100%;
  padding-bottom: 56%;
  background-image: url("../assets/gettingStarted/mapSelection.png");
  background-size: cover;
}
</style>
