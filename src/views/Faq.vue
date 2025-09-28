<template>
  <v-container>
    <v-card tile>
      <v-card-title>{{ $t("views_app.faq") }}</v-card-title>
      <v-tabs v-model="tab">
        <v-tab @click="navigateToFaq">{{ $t("views_app.faq") }}</v-tab>
        <v-tab @click="navigateToSetupGuides">{{ $t("views_setupguides.title") }}</v-tab>
      </v-tabs>

      <div v-if="tab === 0">
        <v-card-text>
          <v-expansion-panels tile>
            <v-expansion-panel v-for="(faq, i) in faqs" :key="i" tile>
              <v-expansion-panel-title>
                <div>{{ faq.question }}</div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-html="faq.answer"></div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </div>

      <div v-if="tab === 1">
        <router-view />
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { API_URL } from "@/main";
import { EMainRouteName, ESetupGuideRouteName } from "@/router/types";

interface Faq {
  question: string;
  answer: string;
}

export default defineComponent({
  name: "FaqView",
  components: {},
  setup() {
    const route = useRoute();
    const router = useRouter();
    const faqs = ref<Faq[]>([]);
    const tab = ref(0);

    const updateTabFromRoute = () => {
      if (route.name === ESetupGuideRouteName.LAUNCHER_SETUP || route.name === ESetupGuideRouteName.INSTALLING_WAR3) {
        tab.value = 1; // Setup Guides tab
      } else {
        tab.value = 0; // FAQ tab
      }
    };

    const navigateToFaq = () => {
      if (route.name !== EMainRouteName.FAQ) {
        router.push({ name: EMainRouteName.FAQ });
      }
    };

    const navigateToSetupGuides = () => {
      if (route.name !== ESetupGuideRouteName.LAUNCHER_SETUP && route.name !== ESetupGuideRouteName.INSTALLING_WAR3) {
        router.push({ name: ESetupGuideRouteName.LAUNCHER_SETUP });
      }
    };

    onMounted(async (): Promise<void> => {
      if (API_URL.includes("test")) {
        await setNewsContent("test");
      } else {
        await setNewsContent("prod");
      }

      updateTabFromRoute();
    });

    // Watch for route changes
    watch(() => route.path, updateTabFromRoute);

    async function setNewsContent(stage: string) {
      const mdNewsResponse = await fetch(
        `https://raw.githubusercontent.com/w3champions/w3champions-news/master/${stage}/faqs.json`
      );
      faqs.value = await mdNewsResponse.json();
    }

    return {
      faqs,
      tab,
      navigateToFaq,
      navigateToSetupGuides,
    };
  },
});
</script>
