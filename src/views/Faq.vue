<template>
  <v-container>
    <v-card tile>
      <v-card-title>{{ $t("views_app.faq") }}</v-card-title>
      <v-card-text>
        <v-expansion-panels tile>
          <v-expansion-panel tile v-for="(faq, i) in faqs" :key="i">
            <v-expansion-panel-header>
              <div v-html="faq.question"></div>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <div v-html="faq.answer"></div>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { API_URL } from "@/main";

interface Faq {
  qestion: string;
  answer: string;
}

@Component({})
export default class FaqView extends Vue {
  public faqs = [] as Faq[];

  async mounted() {
    if (API_URL.includes("test")) {
      await this.setNewsContent("test");
    } else {
      await this.setNewsContent("prod");
    }
  }

  private async setNewsContent(stage: string) {
    const mdNewsResponse = await fetch(
      `https://raw.githubusercontent.com/w3champions/w3champions-news/master/${stage}/faqs.json`
    );
    this.faqs = await mdNewsResponse.json();
  }
}
</script>
