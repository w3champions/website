<template>
  <div class="machine-id-accounts text-body-2">
    <div v-if="loading" class="text-medium-emphasis">{{ t(key("picker_others_loading")) }}</div>
    <div v-else-if="error" class="text-error">{{ banErrorText(error, tr) }}</div>
    <template v-else-if="response">
      <div v-for="account in response.accounts" :key="account.accountKey" class="other-account-line">
        <a class="other-account" :href="accountHref(account.accountKey)" target="_blank" rel="noopener">{{ account.currentBattleTag }}</a>
        <span class="text-medium-emphasis ml-2">{{ otherAccountBanText(account, format()) }}</span>
      </div>
      <div v-if="moreText" class="text-medium-emphasis">{{ moreText }}</div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBanFormat } from "@/composables/useBanFormat";
import { useBanDialogStore } from "@/store/admin/bans/dialogStore";
import { banErrorText } from "@/store/admin/bans/errors";
import { otherAccountBanText, otherAccountsMoreText } from "@/store/admin/bans/machinePicker";
import { key } from "@/store/admin/bans/translate";

const props = defineProps<{ machineId: string }>();

const { t } = useI18n();
const { tr, format, accountHref } = useBanFormat();
const dialogStore = useBanDialogStore();

const response = computed(() => dialogStore.otherAccounts[props.machineId] ?? null);
const loading = computed(() => dialogStore.otherAccountsLoading[props.machineId] === true);
const error = computed(() => dialogStore.otherAccountsError[props.machineId] ?? null);
const moreText = computed(() => (response.value ? otherAccountsMoreText(response.value, tr) : null));
</script>
