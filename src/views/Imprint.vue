<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Legal Disclosure</v-card-title>
          <v-card-text>
            Information in accordance with Section 5 TMG
            <br />Patrick Schäfer <br />St.-Quirin-Str. 1a <br />85777
            Großeisenbach
          </v-card-text>
          <v-card-text>
            <h3>Contact Information</h3>
            <p>
              Telephone: +4915127015465
              <br />E-Mail:
              <a href="mailto:info@w3champions.com">info@w3champions.com</a>
              <br />Internet address:
              <a href="http://w3champions.com" target="_blank"
                >http://w3champions.com</a
              >
            </p>
          </v-card-text>
          <v-card-text>
            <h3>Graphics and Image Sources</h3>
            <p>
              https://blizzard.gamespress.com/de/Warcraft-III-Reforged-Launch-Press-Kit
            </p>
          </v-card-text>
          <v-card-text>
            <h3>Disclaimer</h3>
            Accountability for content
            <p>
              <br />The contents of our pages have been created with the utmost
              care. However, we cannot guarantee the contents' accuracy,
              completeness or topicality. According to statutory provisions, we
              are furthermore responsible for our own content on these web
              pages. In this matter, please note that we are not obliged to
              monitor the transmitted or saved information of third parties, or
              investigate circumstances pointing to illegal activity. Our
              obligations to remove or block the use of information under
              generally applicable laws remain unaffected by this as per §§ 8 to
              10 of the Telemedia Act (TMG).
              <br />
              <br />Accountability for links <br />Responsibility for the
              content of external links (to web pages of third parties) lies
              solely with the operators of the linked pages. No violations were
              evident to us at the time of linking. Should any legal
              infringement become known to us, we will remove the respective
              link immediately.
              <br />
              <br />Copyright <br />Our web pages and their contents are subject
              to German copyright law. Unless expressly permitted by law, every
              form of utilizing, reproducing or processing works subject to
              copyright protection on our web pages requires the prior consent
              of the respective owner of the rights. Individual reproductions of
              a work are only allowed for private use. The materials from these
              pages are copyrighted and any unauthorized use may violate
              copyright laws.
              <br />
              <br />
            </p>
            <i>Source: </i>
            <a href="http://www.translate-24h.de" target="_blank"
              >translate-24h.de - Das Übersetzungsbüro im Internet</a
            >
            <br />
            <br />
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
export default class ImprintView extends Vue {}
</script>

<style type="text/css" scoped>
.v-card__title,
.v-card__text {
  filter: blur(0) !important;
}
</style>
