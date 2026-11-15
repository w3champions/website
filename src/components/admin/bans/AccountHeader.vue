<template>
  <header class="account-header">
    <a class="account-back text-primary" :href="backHref" @click.prevent="emit('back')">{{ t(key("back")) }}</a>
    <div class="account-title-row">
      <h2 class="text-h6 account-title">{{ account.currentBattleTag }}</h2>
      <a class="account-profile text-primary" :href="profileHref" target="_blank" rel="noopener">{{ t(key("profile")) }}</a>
      <v-btn class="bg-primary text-w3-race-bg account-add" @click="emit('add')">{{ t(key("add_ban")) }}</v-btn>
    </div>
    <p v-if="account.counts.inEffect > 0" class="account-in-effect">
      <span class="text-medium-emphasis">{{ t(key("in_effect_now")) }}</span> {{ inEffectText }}
    </p>
    <p v-else class="account-in-effect">{{ inEffectText }}</p>
    <template v-if="hasMachineAccess && account.lockedOutBy && account.lockedOutBy.length > 0">
      <p v-for="locked in account.lockedOutBy" :key="locked.banId" class="account-locked-out">
        <span class="text-medium-emphasis">{{ t(key("locked_out_by")) }}</span>
        <a class="locked-out-link text-primary" :href="accountHref(locked.accountKey)" @click.prevent="emit('openAccount', locked.accountKey)">{{ locked.battleTag }}</a>
      </p>
    </template>
    <account-names :names="account.names" :matched-tag="matchedTag" />
  </header>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useBanFormat } from "@/composables/useBanFormat";
import { useBanPermissions } from "@/composables/useBanPermissions";
import { getProfileUrl } from "@/helpers/url-functions";
import { EAdminRouteName } from "@/router/types";
import { accountInEffectText } from "@/store/admin/bans/inEffect";
import { DEFAULT_PAGE_QUERY, pageQueryToRoute } from "@/store/admin/bans/listQuery";
import { key } from "@/store/admin/bans/translate";
import type { AccountView } from "@/store/admin/bans/types";
import AccountNames from "./AccountNames.vue";

const props = defineProps<{ account: AccountView; matchedTag: string | null }>();
const emit = defineEmits<{
  (e: "back"): void;
  (e: "add"): void;
  (e: "openAccount", accountKey: string): void;
}>();

const { t } = useI18n();
const { format, accountHref } = useBanFormat();
const { hasMachineAccess } = useBanPermissions();

const router = useRouter();

/** Where "All bans" leads: the log, as a link that also opens in a new tab. */
const backHref = computed(() => router.resolve({ name: EAdminRouteName.BANNED_PLAYERS, query: pageQueryToRoute(DEFAULT_PAGE_QUERY) }).href);
const profileHref = computed(() => getProfileUrl(props.account.currentBattleTag));
const inEffectText = computed(() => accountInEffectText(props.account, format()));
</script>

<style scoped>
.account-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.account-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.account-title {
  margin: 0;
}

.account-add {
  margin-left: auto;
}

.account-in-effect,
.account-locked-out {
  margin: 0;
}

.account-back,
.account-profile,
.locked-out-link {
  text-decoration: none;
}

.account-back:hover,
.account-profile:hover,
.locked-out-link:hover {
  text-decoration: underline;
}
</style>
