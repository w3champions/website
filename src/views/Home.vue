<template>
  <v-container>
    <v-row>
      <v-col cols="8">
        <v-card>
          <v-card-title>Welcome</v-card-title>
          <v-card-text>This site is under construction.</v-card-text>
          <v-card-text>
            <p>If you want to test the latest version you have to setup W3Champions once on your pc. It automatically updates to its latest version. Follow these steps to set up everything:</p>
            <ol>
              <li>
                download the attached zip and unpack it directly into your Warcraft 3 folder (usually here C:\Program Files\Warcraft III).
                Afterwards you should find the following file C:\Program Files\Warcraft III\webui\index.html in place. make sure that your unzip program did NOT create two webui folders (/webui/webui/index.html )
              </li>
              <li>start reforged as usual. You will find an additional button on the top of the versus screen to search for an opponent</li>
              <li>keep in mind, this is a very early development stage. Things are not polished, it is no final product. Please let me know about all issues you face.</li>
            </ol>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card>
          <v-card-title>Discord</v-card-title>
          <v-card-text>
            <a href="https://discordapp.com/invite/uJmQxG2">Join us on discord</a>
          </v-card-text>
          <v-card-text></v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="8">
        <v-card>
          <v-card-title>Lastest update</v-card-title>
          <v-card-text>
            <p>New update released. The following features are now available:</p>
            <ul>
              <li>Find opponents in 1on1 (no MMR yet, just randomly putting together players)</li>
              <li>Select race</li>
              <li>record of wins and losses</li>
              <li>profile page: http://profile.w3champions.com/#pad#22587</li>
            </ul>
          </v-card-text>
          <v-card-text>
            <p>
              If you like give it a try yourself, check out #setup-guide. Testing and feedback are highly appreciated.
              Missing features:
            </p>
            <ul>
              <li>multiple maps</li>
              <li>map vetos</li>
              <li>MMR</li>
              <li>Ladder</li>
            </ul>I assume this can be archived until the end of the week - depending on how much spare time i can invest this week.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class HomeView extends Vue {}
</script>
