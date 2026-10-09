<template>
  <v-container class="pa-3 w3-container-width">
    <v-row>
      <v-col cols="12">
        <v-card class="commercial-events">
          <div class="commercial-events__toolbar px-4 pt-4">
            <v-btn-toggle
              v-model="lang"
              mandatory
              density="compact"
              variant="outlined"
              color="primary"
              divided
              aria-label="Language / 语言"
            >
              <v-btn value="en" lang="en">EN</v-btn>
              <v-btn value="zh" lang="zh-Hans">中文</v-btn>
            </v-btn-toggle>
          </div>

          <article :lang="content.htmlLang" class="commercial-events__body px-4 pb-6 pt-2">
            <h1 class="commercial-events__title">{{ content.title }}</h1>
            <p class="commercial-events__lead">
              <InlineText :text="content.lead" />
            </p>
            <p>{{ content.intro }}</p>

            <section
              v-for="section in content.sections"
              :key="section.id"
              :aria-labelledby="`ce-${section.id}`"
              :class="['commercial-events__section', { 'commercial-events__summary': section.highlight }]"
            >
              <h2 :id="`ce-${section.id}`" class="commercial-events__heading">
                <InlineText :text="section.title" />
              </h2>
              <template v-for="(block, index) in section.blocks" :key="index">
                <p v-if="block.type === 'p'">
                  <InlineText :text="block.text" />
                </p>
                <ul v-else>
                  <li v-for="item in block.items" :key="item">
                    <InlineText :text="item" />
                  </li>
                </ul>
              </template>
            </section>

            <section class="commercial-events__section" aria-labelledby="ce-faq">
              <h2 id="ce-faq" class="commercial-events__heading">{{ content.faq.title }}</h2>
              <dl class="commercial-events__faq">
                <div v-for="item in content.faq.items" :key="item.q" class="commercial-events__faq-item">
                  <dt>{{ item.q }}</dt>
                  <dd>{{ item.a }}</dd>
                </div>
              </dl>
            </section>

            <section class="commercial-events__section" aria-labelledby="ce-contact">
              <h2 id="ce-contact" class="commercial-events__heading">{{ content.contact.title }}</h2>
              <p>{{ content.contact.intro }}</p>
              <ul>
                <li>
                  <template v-for="(part, index) in wechatParts" :key="index">
                    <template v-if="part.kind === 'token' && part.token === 'id'">
                      <span ref="wechatIdEl" class="commercial-events__wechat-id">{{ WECHAT_ID }}</span>
                      <v-btn
                        size="x-small"
                        variant="outlined"
                        class="commercial-events__copy ml-2"
                        @click="copyWechatId"
                      >
                        {{ content.contact.copy.label }}
                        <span class="commercial-events__sr-only">&nbsp;{{ WECHAT_ID }}</span>
                      </v-btn>
                      <span class="commercial-events__sr-only" role="status" aria-live="polite">
                        {{ copied ? content.contact.copy.done : "" }}
                      </span>
                    </template>
                    <InlineText v-else-if="part.kind === 'text'" :text="part.text" />
                  </template>
                </li>
                <li>
                  <template v-for="(part, index) in discordParts" :key="index">
                    <a
                      v-if="part.kind === 'token' && part.token === 'invite'"
                      :href="DISCORD_URL"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary"
                    >{{ DISCORD_URL }}</a>
                    <a
                      v-else-if="part.kind === 'token' && part.token === 'contact'"
                      :href="DISCORD_PROFILE_URL"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary"
                    >{{ DISCORD_CONTACT_NAME }}</a>
                    <template v-else-if="part.kind === 'token' && part.token === 'username'">{{ DISCORD_USERNAME }}</template>
                    <InlineText v-else-if="part.kind === 'text'" :text="part.text" />
                  </template>
                </li>
              </ul>
            </section>
          </article>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import InlineText from "./commercial-events/InlineText.vue";
import { parseTemplate } from "./commercial-events/inline";
import {
  type CommercialEventsLang,
  commercialEventsContent,
  DISCORD_CONTACT_NAME,
  DISCORD_PROFILE_URL,
  DISCORD_URL,
  DISCORD_USERNAME,
  resolveLang,
  WECHAT_ID,
} from "./commercial-events/content";

export default defineComponent({
  name: "CommercialEventsView",
  components: { InlineText },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { locale } = useI18n();

    const lang = computed<CommercialEventsLang>({
      get: () => resolveLang(route.query.lang, locale.value),
      set: (value) => {
        if (route.query.lang !== value) {
          void router.replace({ query: { ...route.query, lang: value } });
        }
      },
    });

    const content = computed(() => commercialEventsContent[lang.value]);
    const wechatParts = computed(() => parseTemplate(content.value.contact.wechatLine));
    const discordParts = computed(() => parseTemplate(content.value.contact.discordLine));

    const wechatIdEl = ref<HTMLElement[]>([]);
    const copied = ref(false);
    let copiedTimer: ReturnType<typeof setTimeout> | undefined;
    onBeforeUnmount(() => clearTimeout(copiedTimer));

    const selectWechatId = () => {
      const el = wechatIdEl.value[0];
      const selection = window.getSelection();
      if (!el || !selection) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
    };

    const copyWechatId = async () => {
      try {
        await navigator.clipboard.writeText(WECHAT_ID);
        copied.value = true;
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => copied.value = false, 2000);
      } catch {
        // Clipboard unavailable or denied: select the text so the user can copy it manually.
        selectWechatId();
      }
    };

    return {
      lang,
      content,
      wechatParts,
      discordParts,
      wechatIdEl,
      copied,
      copyWechatId,
      WECHAT_ID,
      DISCORD_URL,
      DISCORD_PROFILE_URL,
      DISCORD_CONTACT_NAME,
      DISCORD_USERNAME,
    };
  },
});
</script>

<style scoped lang="scss">
.commercial-events {
  &__body {
    max-width: 70ch;
    margin: 0 auto;
    overflow-wrap: anywhere;
    line-height: 1.7;

    p,
    ul {
      margin-bottom: 1rem;
    }

    ul {
      padding-left: 1.25rem;
    }
  }

  &__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  &__wechat-id {
    user-select: all;
    font-family: monospace;
  }

  &__toolbar {
    display: flex;
    justify-content: flex-end;
  }

  &__title {
    font-size: clamp(1.6rem, 1.2rem + 2vw, 2.4rem);
    line-height: 1.2;
    margin-bottom: 1rem;
  }

  &__lead {
    font-size: clamp(1.15rem, 1rem + 1vw, 1.5rem);
    line-height: 1.4;
    border-left: 4px solid rgb(var(--v-theme-primary));
    padding-left: 1rem;
    margin-bottom: 1.5rem;
  }

  &__section {
    margin-top: 2rem;
  }

  &__heading {
    font-size: 1.35rem;
    line-height: 1.3;
    margin-bottom: 0.75rem;
  }

  &__summary {
    padding: 1rem 1.25rem 0.25rem;
    border: 1px solid rgba(var(--v-theme-primary), 0.5);
    border-radius: 4px;
    background: rgba(var(--v-theme-primary), 0.1);

    ul {
      list-style: none;
      padding-left: 0;
    }

    li {
      margin-bottom: 0.5rem;
    }
  }

  &__faq-item {
    margin-bottom: 1.25rem;

    dt {
      font-weight: 700;
    }

    dd {
      margin: 0.25rem 0 0;
    }
  }
}
</style>
