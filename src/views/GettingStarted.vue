<template>
  <v-row class="justify-center">
    <v-col cols="7">
      <v-container>
        <v-card tile>
          <v-card-text>
            <v-card-title>How to Install W3 Champions</v-card-title>
            <v-row>
              <v-col>
                <v-card-text>
                  <h3>Automatic Install Windows</h3>
                  <p>
                    We created a setup tool that automatically does all steps
                    needed.
                  </p>
                  <v-btn
                    color="primary"
                    href="../W3Champions-Installer.exe"
                    target="_blank"
                    value
                    outlined
                    class="w3-background"
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">Windows Installer</span>
                  </v-btn>
                  <p>
                    <span class="important">
                     Make sure installer is run as administrator
                    </span>
                    <br/>
                    <span>This is required because installer needs to put the <i>webui</i> folder inside your Warcraft III directory</span>
                    </p>
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
                    <code>Warcraft III\webui\index.html</code>
                  </p>
                  <p>
                    If you have a folder called <i style="color:red">_retail_</i> in your Warcraft III folder,
                    make sure to have the following structure:
                    <br/>
                    <code clas>Warcraft III\<span class="important-dark">_retail_</span>\webui\index.html</code>
                  </p>
                  <p>
                    3. Download the Maps Archive and unpack it to your Warcraft III
                    Maps Folder
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
                    <code>Documents\Warcraft III\Maps\W3Champions\v1\FFA</code>
                  </p>
                  <p>
                    If you have a folder called <i style="color:red">_retail_</i> in your Warcraft III folder,
                    make sure to have the following structure:
                    <code>Documents\Warcraft III\<span class="important-dark">_retail_</span>\Maps\W3Champions\v1\FFA</code>
                  </p>
                </v-card-text>
              </v-col>
              <v-col>
                <v-card-text>
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
                    <code>Warcraft III\webui\index.html</code>
                  </p>
                  <p>
                    If you have a folder called <i style="color:red">_retail_</i> in your Warcraft III folder,
                    make sure to have the following structure:
                    <br/>
                    <code clas>Warcraft III\<span class="important-dark">_retail_</span>\webui\index.html</code>
                  </p>
                  <p>
                    3. Download the Maps Archive and unpack it to your Warcraft III
                    Maps Folder
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
                    <code>Warcraft III\Maps\W3Champions\v1\FFA</code>
                  </p>
                  <p>
                    If you have a folder called <i style="color:red">_retail_</i> in your Warcraft III folder,
                    make sure to have the following structure:
                    <code>Warcraft III\<span class="important-dark">_retail_</span>\Maps\W3Champions\v1\FFA</code>
                  </p>
                </v-card-text>
              </v-col>
            </v-row>
            <br />
            <div class="filter-blur text-center">
              <h3>
                If you are having trouble with the installer. You can use this
                video to manually install W3C.
              </h3>
              <p>
                The video is shot on Windows but it should work for other
                operating systems as well.
              </p>
              <br/>
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
                  If your still having problems: <a href="https://discord.gg/uJmQxG2">Reach out to us on discord</a>
                </div>
              </v-card-text>
            </div>
          </v-card-text>
        </v-card>
      </v-container>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class GettingStartedView extends Vue {}
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
</style>