<template>
  <v-row class="justify-center">
    <v-col cols="12" md="7">
      <v-container>
        <v-card tile>
          <v-card-title class="text-center">
            How to Install W3 Champions
          </v-card-title>
          <v-tabs v-model="tabsModel" vertical class="ml-5">
            <v-tabs-slider></v-tabs-slider>
            <v-tab class="profileTab" :href="`#launcher`">Launcher</v-tab>
            <v-tab class="profileTab" :href="`#windows-setup`">Manual Windows</v-tab>
            <v-tab class="profileTab" :href="`#mac-setup`">Manual Mac</v-tab>
            <v-tabs-items v-model="tabsModel" touchless>
              <v-tab-item :value="'launcher'">
                <v-card-text class="px-16">
                  <h3>Download Warcraft III Champions</h3>
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
                  <h3>After the Installation, open W3Champions and join us!</h3>
                  <br/>
                  <div class="w3c-screenshot" />
                  <v-card-text>
                    Launcher features:
                    <ul>
                      <li>
                        Always have w3c installed, never have Problems with missing or outdated maps! Fixes problems of the Joinbug!
                      </li>
                      <li>
                        Remap item and hero hotkeys
                      </li>
                      <li>
                        Custom team coloring
                      </li>
                      <li>
                        Keep up with the scene by getting the latest news
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
                  <h3 class="mt-10">Manual Windows</h3>
                  <p>
                    1. Download the zip file and unpack it in your Warcraft
                    Installation folder
                  </p>
                  <v-btn
                    class="w3-background"
                    color="primary"
                    :href="webUiLink"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">W3Champions</span>
                  </v-btn>
                  <p class="mt-2">
                    2. Make sure to have a directory structure like:
                    <br />
                    <code>Warcraft III\webui\index.html</code>
                  </p>
                  <p>
                    If you have a folder called
                    <i style="color: red;">_retail_</i>
                    in your Warcraft III folder, make sure to have the following
                    structure:
                    <br />
                    <code clas>
                      Warcraft III\
                      <span class="important-dark">_retail_</span>
                      \webui\index.html
                    </code>
                  </p>
                  <p>
                    3. Download the Maps and unpack it to your Warcraft
                    III Maps Folder
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
                      Download MAPS
                    </span>
                  </v-btn>
                  <p class="mt-2">
                    4. The folder structure after unpacking should be
                    <br />
                    <code>Documents\Warcraft III\Maps\W3Champions</code>
                  </p>
                  <p>
                    <i style="color: red;">Important</i> <br/>
                    If you have a Maps folder inside your Warcraft 3 directory go ahead and delete it. <br/>
                    DELETE <code>Path-to-game/Maps </code> <br/>
                    DELETE <code>Path-to-game/retail/maps </code> <br/>

                    Example: <br/>
                    DELETE <code>C:\Program Files (x86)\Warcraft III\Maps</code> <br/>
                    DELETE <code>C:\Program Files (x86)\Warcraft III_retail_\Maps</code> <br/>
                  </p>
                  <p class="mt-2">
                    5. As of War3 version 1.32.7 you need to set a registry (Installer is doing this automatically)
                    <br />
                  </p>
                  <p>
                    <ul>
                      <li>
                        open regedit.exe
                      </li>
                      <li>
                        Find the registry
                         <code>Computer\HKEY_CURRENT_USER\Software\Blizzard Entertainment\Warcraft III\</code>
                      </li>
                      <li>
                        Add DWORD key to this registry path
                        <ul>
                          <li>
                            name: <code>Allow Local Files</code>
                          </li>
                          <li>
                            decimal value: <code>1</code>
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
                  <h3 class="mt-10">Manual Mac OS</h3>
                  <p>
                    1. Download the zip file and unpack it in your Warcraft
                    Installation folder
                  </p>
                  <v-btn
                    class="w3-background"
                    color="primary"
                    :href="webUiLink"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">W3Champions</span>
                  </v-btn>
                  <p class="mt-2">
                    2. Make sure to have a directory structure like:
                    <br />
                    <code>Warcraft III\webui\index.html</code>
                  </p>
                  <p>
                    If you have a folder called
                    <i style="color: red;">_retail_</i>
                    in your Warcraft III folder, make sure to have the following
                    structure:
                    <br />
                    <code clas>
                      Warcraft III\
                      <span class="important-dark">_retail_</span>
                      \webui\index.html
                    </code>
                  </p>
                  <p>
                    3. Download the Maps and unpack it to your Warcraft
                    III Maps Folder
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
                      Download MAPS
                    </span>
                  </v-btn>
                  <p class="mt-2">
                    4. The folder structure after unpacking should be
                    <br />
                    <code>Library/Application Support/Blizzard/Warcraft III/Maps/W3Champions</code>
                  </p>
                  <p>
                    <i style="color: red;">Important</i> <br/>
                    If you have a Maps folder inside your Warcraft 3 directory go ahead and delete it. <br/>
                    DELETE <code>Path-to-game/Maps </code> <br/>
                    DELETE <code>Path-to-game/retail/maps </code> <br/>

                    Example: <br/>
                    DELETE <code>Warcraft III\Maps</code> <br/>
                    DELETE <code>Warcraft III_retail_\Maps</code> <br/>
                  </p>
                  <p class="mt-2">
                    5. As of War3 version 1.32.7 you need to set a registry
                    <br />
                  </p>
                  <p>
                    <ul>
                      <li>
                        Copy command <code>defaults write "com.blizzard.Warcraft III" "Allow Local Files" -int 1 </code>
                      </li>
                      <li>
                        Open terminal
                      </li>
                      <li>
                        Paste command and execute by pressing Enter key.
                      </li>
                      <li>
                        Run Warcraft 3. You should see W3champions.
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
  background-image: url("../assets/w3championsScreenshot.png");
  background-size: cover;
}
</style>
