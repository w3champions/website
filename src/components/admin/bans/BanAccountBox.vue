<template>
  <div class="ban-account-box text-body-2 mb-4">
    <template v-if="account.counts.total === 0">{{ t(key("no_bans")) }}</template>
    <template v-else>
      <div class="ban-account-box__in-effect">{{ inEffect }}</div>
      <div v-if="past" class="text-medium-emphasis">{{ past }}</div>
      <a :href="accountHref(account.accountKey)" target="_blank" rel="noopener" class="ban-open-account">
        {{ t(key("box_open_account")) }}
      </a>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBanFormat } from "@/composables/useBanFormat";
import { accountBoxInEffectText, accountBoxPastText } from "@/store/admin/bans/inEffect";
import { key } from "@/store/admin/bans/translate";
import type { AccountView } from "@/store/admin/bans/types";

const props = defineProps<{ account: AccountView; editingId?: string }>();

const { t } = useI18n();
const { format, accountHref } = useBanFormat();

const inEffect = computed(() => accountBoxInEffectText(props.account, props.editingId, format()));
const past = computed(() => accountBoxPastText(props.account, format()));
</script>

<style scoped>
.ban-account-box__in-effect {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
</style>
