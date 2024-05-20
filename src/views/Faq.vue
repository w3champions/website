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
import { defineComponent, onMounted, ref } from "vue";
import { API_URL } from "@/main";

interface Faq {
  question: string;
  answer: string;
}

export default defineComponent({
  name: "FaqView",
  components: {},
  props: {},
  setup() {
    const faqs = ref<Faq[]>([]);

    onMounted(async (): Promise<void> => {
      if (API_URL.includes("test")) {
        await setNewsContent("test");
      } else {
        await setNewsContent("prod");
      }
    });

    async function setNewsContent(stage: string) {
      const mdNewsResponse = await fetch(
        `https://raw.githubusercontent.com/w3champions/w3champions-news/master/${stage}/faqs.json`
      );
      faqs.value = await mdNewsResponse.json();
    }

    return {
      faqs,
    };
  },
});
</script>
