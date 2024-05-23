<template>
  <v-container>
    <v-card class="text-center">
      <v-progress-circular
        :size="100"
        color="primary"
        indeterminate
        class="loader"
      >
        <div class="inner-text">{{ $t("views_login.loggingyouin") }}</div>
      </v-progress-circular>
    </v-card>
  </v-container>
</template>
<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted } from "vue";
import { getProfileUrl } from "@/helpers/url-functions";
import { useOauthStore } from "@/store/oauth/store";
import { useRouter } from "vue-router";
import { useCookies } from "@/mixins/useCookies";
import { BnetOAuthRegion } from "@/store/oauth/types";

export default defineComponent({
  name: "LoginView",
  components: {},
  props: {
    code: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const oauthStore = useOauthStore();
    const cookies = useCookies();

    const account: ComputedRef<string> = computed((): string => oauthStore.blizzardVerifiedBtag);
    const authCode: ComputedRef<string> = computed((): string => oauthStore.token);

    function openPlayerProfile() {
      router.push({
        path: getProfileUrl(account.value) + `?freshLogin=true`,
      });
    }

    async function init(): Promise<void> {
      const region: BnetOAuthRegion = cookies.get("W3ChampionsAuthRegion") ?? "";
      await oauthStore.authorizeWithCode(props.code, region);
      await oauthStore.loadBlizzardBtag(authCode.value);
      cookies.set("W3ChampionsJWT", authCode.value, Infinity); // Cookie never expires
      openPlayerProfile();
    }

    onMounted((): void => {
      init();
    });

    return {
    };
  },
});
</script>

<style lang="scss" scoped>
.inner-text {
  margin: 20px;
  text-align: center;
}

.loader {
  margin: 180px auto;
}
</style>
