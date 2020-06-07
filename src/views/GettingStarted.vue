<template>
  <v-row class="justify-center">
    <v-col cols="8">
      <v-container>
        <v-card tile>
          <v-card-text>
            <v-card-title>Come and join us!</v-card-title>
            <v-card-text>
              <v-row>
                <v-col>
                  Finally your Warcraft III 1on1 Ladder is available, crafted by
                  and for the community!
                  <br />
                  <br />
                  The ladder contains:
                  <ul>
                    <li>Improved Pings by non-global ladder</li>
                    <li>Matchmaking (based on W3Arena)</li>
                    <li>Ladder System (Check the RANKINGS tab top right)</li>
                    <li>Seamless integration in your Warcraft III client</li>
                    <li>Profiles</li>
                    <li>Different Mappool</li>
                  </ul>
                  <br />
                  <b>Current Map Pool</b>
                  <br />
                  TM,EI,TSLV,CH,NIS,AZ and LR
                </v-col>
                <v-col>
                  <img
                    src="../assets/reforged.jpg"
                    style="max-width: 90%; max-height: 320px;"
                  />
                </v-col>
              </v-row>
            </v-card-text>
            <v-row>
              <v-col cols="8" md="5">
                <h3>Installation Guide Windows</h3>
                <p>
                  We created a setup tool that automatically does all steps
                  needed.
                </p>
                <v-btn
                  color="primary"
                  href="./W3Champions.msi"
                  target="_blank"
                  value
                  outlined
                  class="w3-background"
                >
                  <v-icon>mdi-download</v-icon>
                  <span class="mr-2 hidden-xs-only">Windows launcher</span>
                </v-btn>
              </v-col>
              <v-col>
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
                    href="./MAC-W3Champions.zip"
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
                    href="./W3Champions-Maps-V1.zip"
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

              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/l1aRcUL7qEc"
                frameborder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
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
