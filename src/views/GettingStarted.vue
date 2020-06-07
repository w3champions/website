<template>
  <v-row class="justify-center">
    <v-col cols="6">
      <v-container>
        <v-card tile>
          <v-card-text>
            <v-card-title>How to Install W3 Champions</v-card-title>
            <v-row>
              <v-col>
                <v-card-text>
                  <h3>Installation Guide Windows</h3>
                  <p>
                    We created a setup tool that automatically does all steps
                    needed.
                  </p>
                  <v-btn
                    color="primary"
                    href="../W3Champions.msi"
                    target="_blank"
                    value
                    outlined
                    class="w3-background"
                  >
                    <v-icon>mdi-download</v-icon>
                    <span class="mr-2 hidden-xs-only">Windows launcher</span>
                  </v-btn>
                </v-card-text>
              </v-col>
              <v-col>
                <v-card-text>
                  <h3>Installation Guide Mac OS / Manual installation</h3>
                  <p>
                    If you are using a MAC or you are having trouble with the
                    launcher you can install W3Champions manually.
                  </p>
                  <ol>
                    <li>
                      Download the archive file and unpack it in your Warcraft
                      Installation folder
                    </li>
                    <v-btn
                      class="w3-background ma-4"
                      color="primary"
                      href="../MAC-W3Champions.zip"
                      target="_blank"
                      outlined
                    >
                      <v-icon>mdi-download</v-icon>
                      <span class="mr-2 hidden-xs-only">Mac Archive</span>
                    </v-btn>
                    <li>
                      Make sure to have a directory structure like Warcraft
                      III\webui\index.html
                    </li>
                    <li>
                      Download the Maps Archive and unpack it to your Warcraft III
                      Maps Folder
                    </li>
                    <v-btn
                      class="w3-background ma-4"
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
                    <li>
                      The folder structure after unpacking should be
                      Maps/W3Champions/v1/FFA
                    </li>
                  </ol>
                </v-card-text>
              </v-col>
            </v-row>
            <br />
            <div class="filter-blur text-center mt-5">
              <h3>
                If you are having trouble with the launcher. You can use this
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
