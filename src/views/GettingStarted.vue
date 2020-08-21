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
            <v-tab class="profileTab" :href="`#launcher`">Installer</v-tab>
            <v-tab class="profileTab" :href="`#windows-setup`">Manual Install Windows</v-tab>
            <v-tab class="profileTab" :href="`#mac-setup`">Manual Install Mac</v-tab>
            <v-tabs-items v-model="tabsModel" touchless>
              <v-tab-item :value="'launcher'">
                <v-card-text class="centered-container">
                  <h3>Warcraft III Champions Installer</h3>
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
                  <v-card-text>
                    Features from the Launcher
                    <ul>
                      <li>
                        Always have w3c installed, never have Problems with missing or outdated maps! Fixes problems of the Joinbug!
                      </li>
                      <li>
                        Remap Item-hotkeys
                      </li>
                      <li>
                        Keep up with the scene by getting the latest news
                      </li>
                    </ul>
                  </v-card-text>
                </v-card-text>
              </v-tab-item>
              <v-tab-item :value="'windows-setup'">
                <v-card-text class="centered-container">
                  <h3 class="mt-10">Manual Install Windows</h3>
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
                <v-card-text class="centered-container">
                  <h3 class="mt-10">Manual Install Mac OS</h3>
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
                  <iframe class="mt-3" width="560" height="315" src="https://www.youtube.com/embed/8s53BHfKPLs" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
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

.centered-container {
  max-width: 650px;
  margin-left: 100px;
}

.v-tab--active::before {
  opacity: 0.12 !important;
}

.theme--dark.v-application .v-btn.join-button {
  text-shadow: none !important;
  color: black !important;
}

.gettingStartedPictures {
  margin-bottom: 30px;
  background-position: center;
  background-repeat: no-repeat;
}

.login-picture {
  background-image: url("../assets/gettingStartedChat/1.jpg");
  height: 350px;
}

.chat-key-picture {
  background-image: url("../assets/gettingStartedChat/2.jpg");
  height: 280px;
}

.download-picture {
  background-image: url("../assets/gettingStartedChat/3.jpg");
  height: 240px;
}

.bnet-place-picture {
  background-image: url("../assets/gettingStartedChat/4.jpg");
  height: 450px;
}

.webui-location-picture {
  background-image: url("../assets/gettingStartedChat/5.jpg");
  height: 350px;
}

.key-place-picture {
  background-image: url("../assets/gettingStartedChat/6.jpg");
  height: 100px;
}

</style>
