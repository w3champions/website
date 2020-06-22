<template>
  <v-row class="justify-center">
    <v-col cols="7">
      <v-container>
        <v-card tile>
          <v-card-title class="text-center">
            How to Install W3 Champions
          </v-card-title>
          <v-tabs v-model="tabsModel" vertical class="ml-5">
            <v-tabs-slider></v-tabs-slider>
            <v-tab class="profileTab" :href="`#windows-setup`">Windows</v-tab>
            <v-tab class="profileTab" :href="`#mac-setup`">Mac</v-tab>
            <v-tab class="profileTab" :href="`#video`">Video</v-tab>
            <v-tab class="profileTab" v-if="isChatEnabled" :href="`#chat`">
              Chat
            </v-tab>
            <v-tabs-items v-model="tabsModel" touchless>
              <v-tab-item :value="'windows-setup'">
                <v-card-text class="centered-container">
                  <h3>Automatic Install Windows</h3>
                  <p>
                    We created a setup tool that automatically does all steps
                    needed.
                  </p>
                  <v-btn
                    href="../W3Champions-Installer.exe"
                    target="_blank"
                    value
                    class="join-button mt-0 mb-4"
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">Windows Installer</span>
                  </v-btn>
                  <p>
                    <span class="important">
                      Make sure installer is run as administrator
                    </span>
                    <br />
                    <span>
                      This is required because installer needs to put the
                      <i>webui</i>
                      folder inside your Warcraft III directory
                    </span>
                  </p>
                  <v-divider></v-divider>
                  <h3 class="mt-10">Manual Install Windows</h3>
                  <p>
                    1. Download the archive file and unpack it in your Warcraft
                    Installation folder
                  </p>
                  <v-btn
                    class="w3-background"
                    color="primary"
                    href="../W3Champions-webui.zip"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">W3Champions Archive</span>
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
                    3. Download the Maps Archive and unpack it to your Warcraft
                    III Maps Folder
                  </p>
                  <v-btn
                    class="w3-background"
                    color="primary"
                    href="../W3Champions-Maps-V1.zip"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">
                      Download MAPS archive
                    </span>
                  </v-btn>
                  <p class="mt-2">
                    4. The folder structure after unpacking should be
                    <br />
                    <code>Documents\Warcraft III\Maps\W3Champions\v1\FFA</code>
                  </p>
                  <p>
                    If you have a folder called
                    <i style="color: red;">_retail_</i>
                    in your Warcraft III folder, make sure to have the following
                    structure:
                    <br />
                    <code>
                      Documents\Warcraft III\
                      <span class="important-dark">_retail_</span>
                      \Maps\W3Champions\v1\FFA
                    </code>
                  </p>
                </v-card-text>
              </v-tab-item>
              <v-tab-item :value="'mac-setup'">
                <v-card-text class="centered-container">
                  <h3>Manual Install Mac OS</h3>
                  <p>
                    1. Download the archive file and unpack it in your Warcraft
                    Installation folder
                  </p>
                  <v-btn
                    class="w3-background"
                    color="primary"
                    href="../W3Champions-webui.zip"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">W3Champions Archive</span>
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
                    3. Download the Maps Archive and unpack it to your Warcraft
                    III Maps Folder
                  </p>
                  <v-btn
                    class="w3-background"
                    color="primary"
                    href="../W3Champions-Maps-V1.zip"
                    target="_blank"
                    outlined
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">
                      Download MAPS archive
                    </span>
                  </v-btn>
                  <p class="mt-2">
                    4. The folder structure after unpacking should be
                    <br />
                    <code>Warcraft III\Maps\W3Champions\v1\FFA</code>
                  </p>
                  <p>
                    If you have a folder called
                    <i style="color: red;">_retail_</i>
                    in your Warcraft III folder, make sure to have the following
                    structure:
                    <br />
                    <code>
                      Warcraft III\
                      <span class="important-dark">_retail_</span>
                      \Maps\W3Champions\v1\FFA
                    </code>
                  </p>
                </v-card-text>
              </v-tab-item>
              <v-tab-item :value="'video'">
                <v-card-text class="filter-blur">
                  <div class="filter-blur text-center">
                    <h3>
                      If you are having trouble with the installer. You can use
                      this video to manually install W3C.
                    </h3>
                    <p>
                      The video is shot on Windows but it should work for other
                      operating systems as well.
                    </p>
                    <br />
                    <iframe
                      width="560"
                      height="315"
                      src="https://www.youtube.com/embed/l1aRcUL7qEc"
                      frameborder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                    <v-card-text class="text-center ma-5">
                      <div>
                        If your still having problems:
                        <a href="https://discord.gg/uJmQxG2">
                          Reach out to us on discord
                        </a>
                      </div>
                    </v-card-text>
                  </div>
                </v-card-text>
              </v-tab-item>
              <v-tab-item :value="'chat'">
                <v-card-text class="filter-blur">
                  <div class="filter-blur">
                    <h3>
                      To unlock actions tied to your profile in game (e.g. changing race pictures), follow these steps
                    </h3>
                    <br />
                    <p>1. Login with your Battle Net Account on the top right</p>
                    <div class="login-picture gettingStartedPictures" />
                    <p>2. Click on the Profile Icon Dropdown the "chat key" button</p>
                    <div class="chat-key-picture gettingStartedPictures" />
                    <p>3. A key will be downloaded. If you have allready downloaded a key, the previous key will be invalidated</p>
                    <div class="download-picture gettingStartedPictures" />
                    <p>4. Place the w3champions.key file next to your index.html file in the webui folder. To locate your webui folder, click on the Options button in the BattleNet Launcher and select "Show in Explorer". <b>If you have a folder called _retail_ in your Warcraft III folder, the webui folder is in there!</b></p>
                    <div class="bnet-place-picture gettingStartedPictures" />
                    <div class="webui-location-picture gettingStartedPictures" />
                    <div class="key-place-picture gettingStartedPictures" />
                    <p>5. If you now start Warcraft you should see a lock icon next to your username in chat. This shows, that you are sucessfully authenticated with our website and that you can take actions related to your profile (switching icons, managing the clan etc.)</p>
                    <div class="chat-picture gettingStartedPictures" />
                    <v-card-text class="text-center ma-5">
                      <div>
                        If your still having problems:
                        <a href="https://discord.gg/uJmQxG2">
                          Reach out to us on discord
                        </a>
                      </div>
                    </v-card-text>
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
import { FEATURE_FLAG_CLANS } from "@/main";

@Component({})
export default class GettingStartedView extends Vue {

  get isChatEnabled() {
    return FEATURE_FLAG_CLANS;
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
